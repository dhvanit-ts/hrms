import { Server as SocketIOServer } from "socket.io";
import { logger } from "@/config/logger.js";
import { NotificationService } from "./notification.service.js";

export class NotificationDeliveryService {
  private io: SocketIOServer | null = null;
  private notificationService = new NotificationService();

  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    logger.info("Socket.IO server attached to notification delivery service");
  }

  async deliverNotification(
    receiverId: number,
    receiverType: "employee" | "user",
    notificationId: number
  ): Promise<void> {
    if (!this.io) {
      logger.debug("Socket.IO not available, skipping real-time delivery");
      return;
    }

    try {
      // Get the notification details
      const { notifications } = await this.notificationService.getNotifications(
        receiverId,
        receiverType,
        { limit: 1, offset: 0 }
      );

      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        logger.warn("Notification not found for delivery", { notificationId });
        return;
      }

      // Create room name based on receiver
      const roomName = `${receiverType}:${receiverId}`;

      // Emit to the specific user's room
      this.io.to(roomName).emit("notification", {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        count: notification.count,
        createdAt: notification.createdAt
      });

      // Mark as delivered
      await this.notificationService.markAsDelivered([notificationId]);

      logger.debug("Notification delivered via socket", {
        receiverId,
        receiverType,
        notificationId
      });
    } catch (error) {
      logger.error("Failed to deliver notification via socket", {
        receiverId,
        receiverType,
        notificationId,
        error
      });
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
      this.io.to(roomName).emit("unread-count", { unreadCount });
    } catch (error) {
      logger.error("Failed to deliver unread count", { receiverId, receiverType, error });
    }
  }
}