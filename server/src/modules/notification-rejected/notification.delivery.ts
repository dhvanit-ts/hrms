import { Server as SocketIOServer } from "socket.io";
import { logger } from "@/config/logger.js";
import { NotificationService } from "./notification.service.js";

interface DeliveryAttempt {
  notificationId: number;
  receiverId: number;
  receiverType: "employee" | "user";
  attempts: number;
  lastAttempt: Date;
  nextRetry: Date;
}

interface DeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingRetries: number;
}

export class NotificationDeliveryService {
  private io: SocketIOServer | null = null;
  private notificationService = new NotificationService();
  private failedDeliveries = new Map<string, DeliveryAttempt>();
  private retryTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private stats: DeliveryStats = {
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    pendingRetries: 0
  };

  private readonly maxRetries = 3;
  private readonly baseRetryDelayMs = 2000;
  private readonly maxRetryDelayMs = 30000;
  private readonly deliveryTimeoutMs = 8000;

  constructor() {
    this.startRetryMechanism();
    this.setupGracefulShutdown();
  }

  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    this.setupSocketErrorHandling();
    logger.info("Socket.IO server attached to notification delivery service");
  }

  async deliverNotification(
    receiverId: number,
    receiverType: "employee" | "user",
    notificationId: number
  ): Promise<void> {
    this.stats.totalDeliveries++;

    const deliveryKey = `${receiverType}:${receiverId}:${notificationId}`;

    try {
      await this.withTimeout(
        this.deliverNotificationInternal(receiverId, receiverType, notificationId),
        this.deliveryTimeoutMs,
        `Delivering notification ${notificationId}`
      );

      this.stats.successfulDeliveries++;

      // Remove from failed deliveries if it was there
      this.failedDeliveries.delete(deliveryKey);

      logger.debug("Notification delivered successfully", {
        notificationId,
        receiverId,
        receiverType
      });

    } catch (error) {
      this.stats.failedDeliveries++;

      logger.error("Notification delivery failed", {
        notificationId,
        receiverId,
        receiverType,
        error: error instanceof Error ? error.message : String(error)
      });

      // Add to retry queue
      await this.handleFailedDelivery(deliveryKey, receiverId, receiverType, notificationId, error as Error);
    }
  }

  private async deliverNotificationInternal(
    receiverId: number,
    receiverType: "employee" | "user",
    notificationId: number
  ): Promise<void> {
    // Skip if no socket server available
    if (!this.io) {
      logger.debug("Socket.IO not available, skipping real-time delivery");
      return;
    }

    // Get the notification details with error handling
    let notification;
    try {
      const { notifications } = await this.notificationService.getNotifications(
        receiverId,
        receiverType,
        { limit: 1, offset: 0 }
      );

      notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }
    } catch (error) {
      logger.error("Failed to fetch notification for delivery", {
        notificationId,
        receiverId,
        receiverType,
        error
      });
      throw error;
    }

    // Create room name based on receiver
    const roomName = `${receiverType}:${receiverId}`;

    // Check if user is connected
    const connectedSockets = await this.io.in(roomName).fetchSockets();
    if (connectedSockets.length === 0) {
      logger.debug("No connected sockets for user, notification will be available via API", {
        roomName,
        notificationId
      });
      // Don't throw error - this is normal when user is offline
      return;
    }

    // Emit to the specific user's room
    const notificationData = {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      count: notification.count,
      createdAt: notification.createdAt,
      actors: notification.actors
    };

    this.io.to(roomName).emit("notification", notificationData);

    // Also emit updated unread count
    try {
      const { unreadCount } = await this.notificationService.getNotifications(
        receiverId,
        receiverType,
        { limit: 0, unreadOnly: true }
      );

      this.io.to(roomName).emit("unread-count", { unreadCount });
    } catch (error) {
      logger.warn("Failed to emit unread count", { receiverId, receiverType, error });
      // Don't throw - main notification was delivered
    }

    // Mark as delivered
    try {
      await this.notificationService.markAsDelivered([notificationId]);
    } catch (error) {
      logger.warn("Failed to mark notification as delivered", { notificationId, error });
      // Don't throw - delivery was successful
    }
  }

  async deliverUnreadCount(receiverId: number, receiverType: "employee" | "user"): Promise<void> {
    if (!this.io) return;

    try {
      const { unreadCount } = await this.notificationService.getNotifications(
        receiverId,
        receiverType,
        { limit: 0, unreadOnly: true }
      );

      const roomName = `${receiverType}:${receiverId}`;

      // Check if user is connected before emitting
      const connectedSockets = await this.io.in(roomName).fetchSockets();
      if (connectedSockets.length > 0) {
        this.io.to(roomName).emit("unread-count", { unreadCount });
        logger.debug("Unread count delivered", { receiverId, receiverType, unreadCount });
      }
    } catch (error) {
      logger.error("Failed to deliver unread count", { receiverId, receiverType, error });
    }
  }

  private async handleFailedDelivery(
    deliveryKey: string,
    receiverId: number,
    receiverType: "employee" | "user",
    notificationId: number,
    error: Error
  ): Promise<void> {
    const existingAttempt = this.failedDeliveries.get(deliveryKey);
    const attempts = existingAttempt ? existingAttempt.attempts + 1 : 1;

    if (attempts > this.maxRetries) {
      logger.error("Delivery exceeded max retries, giving up", {
        deliveryKey,
        notificationId,
        attempts
      });
      this.failedDeliveries.delete(deliveryKey);
      return;
    }

    const delay = Math.min(
      this.baseRetryDelayMs * Math.pow(2, attempts - 1),
      this.maxRetryDelayMs
    );

    const nextRetry = new Date(Date.now() + delay);

    this.failedDeliveries.set(deliveryKey, {
      notificationId,
      receiverId,
      receiverType,
      attempts,
      lastAttempt: new Date(),
      nextRetry
    });

    this.stats.pendingRetries = this.failedDeliveries.size;

    logger.info("Delivery scheduled for retry", {
      deliveryKey,
      notificationId,
      attempts,
      nextRetry: nextRetry.toISOString(),
      delayMs: delay
    });
  }

  private startRetryMechanism(): void {
    this.retryTimer = setInterval(async () => {
      if (this.isShuttingDown || this.failedDeliveries.size === 0) return;

      const now = new Date();
      const deliveriesToRetry: string[] = [];

      // Find deliveries ready for retry
      for (const [deliveryKey, attempt] of this.failedDeliveries.entries()) {
        if (attempt.nextRetry <= now) {
          deliveriesToRetry.push(deliveryKey);
        }
      }

      // Process retries
      for (const deliveryKey of deliveriesToRetry) {
        const attempt = this.failedDeliveries.get(deliveryKey);
        if (attempt) {
          logger.info("Retrying failed delivery", {
            deliveryKey,
            notificationId: attempt.notificationId,
            attempt: attempt.attempts + 1
          });

          await this.deliverNotification(
            attempt.receiverId,
            attempt.receiverType,
            attempt.notificationId
          );
        }
      }

      this.stats.pendingRetries = this.failedDeliveries.size;
    }, 10000); // Check every 10 seconds
  }

  private setupSocketErrorHandling(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      socket.on("error", (error) => {
        logger.error("Socket error", { socketId: socket.id, error });
      });

      socket.on("disconnect", (reason) => {
        logger.debug("Socket disconnected", { socketId: socket.id, reason });
      });
    });

    this.io.engine.on("connection_error", (error) => {
      logger.error("Socket.IO connection error", { error });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Notification delivery service received ${signal}, starting graceful shutdown`);
      this.isShuttingDown = true;

      // Stop retry mechanism
      if (this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = null;
      }

      // Log pending deliveries for manual recovery
      if (this.failedDeliveries.size > 0) {
        logger.warn("Shutdown with pending failed deliveries", {
          pendingCount: this.failedDeliveries.size,
          failedDeliveries: Array.from(this.failedDeliveries.entries()).map(([key, attempt]) => ({
            key,
            notificationId: attempt.notificationId,
            receiverId: attempt.receiverId,
            receiverType: attempt.receiverType,
            attempts: attempt.attempts
          }))
        });
      }

      logger.info("Notification delivery service shutdown complete", {
        stats: this.stats
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // Health check and monitoring
  getDeliveryStats(): DeliveryStats & {
    failedDeliveryKeys: string[];
    isShuttingDown: boolean;
    hasSocketServer: boolean;
  } {
    return {
      ...this.stats,
      failedDeliveryKeys: Array.from(this.failedDeliveries.keys()),
      isShuttingDown: this.isShuttingDown,
      hasSocketServer: this.io !== null
    };
  }

  // Manual recovery methods
  async retryFailedDelivery(deliveryKey: string): Promise<boolean> {
    const attempt = this.failedDeliveries.get(deliveryKey);
    if (!attempt) {
      logger.warn("Failed delivery not found for manual retry", { deliveryKey });
      return false;
    }

    logger.info("Manual retry of failed delivery", {
      deliveryKey,
      notificationId: attempt.notificationId
    });

    await this.deliverNotification(
      attempt.receiverId,
      attempt.receiverType,
      attempt.notificationId
    );

    return true;
  }

  async clearFailedDeliveries(): Promise<number> {
    const count = this.failedDeliveries.size;
    this.failedDeliveries.clear();
    this.stats.pendingRetries = 0;
    logger.info("Cleared all failed deliveries", { count });
    return count;
  }

  resetStats(): void {
    this.stats = {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      pendingRetries: this.failedDeliveries.size
    };
    logger.info("Delivery stats reset");
  }
}