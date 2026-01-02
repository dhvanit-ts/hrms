import { eventBus, type DomainEvent } from "../../infra/services/event-bus.js";
import { NotificationProcessor } from "./notification.processor.js";
import { NotificationDeliveryService } from "./notification.delivery.js";
import { logger } from "@/config/logger.js";
import type { Server as SocketIOServer } from "socket.io";

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

interface NotificationSystemConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  processingTimeoutMs: number;
  deliveryTimeoutMs: number;
  enableGracefulDegradation: boolean;
}

interface FailedEvent {
  event: DomainEvent;
  error: Error;
  attempts: number;
  lastAttempt: Date;
  nextRetry: Date;
}

enum CircuitBreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN"
}

export class NotificationSystem {
  private processor = new NotificationProcessor();
  private deliveryService = new NotificationDeliveryService();
  private isInitialized = false;
  private isShuttingDown = false;

  // Resilience components
  private failedEvents = new Map<string, FailedEvent>();
  private retryTimer: NodeJS.Timeout | null = null;
  private circuitBreakerState = CircuitBreakerState.CLOSED;
  private circuitBreakerFailures = 0;
  private circuitBreakerLastFailure: Date | null = null;
  private processingQueue: DomainEvent[] = [];
  private isProcessing = false;

  private readonly config: NotificationSystemConfig = {
    retry: {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringWindowMs: 300000
    },
    processingTimeoutMs: 30000,
    deliveryTimeoutMs: 10000,
    enableGracefulDegradation: true
  };

  initialize(io?: SocketIOServer): void {
    if (this.isInitialized) {
      logger.warn("Notification system already initialized");
      return;
    }

    try {
      // Set up socket server if provided
      if (io) {
        this.deliveryService.setSocketServer(io);
      }

      // Subscribe to all domain events with resilient processing
      eventBus.subscribeToAll(async (event: DomainEvent) => {
        await this.processEventSafely(event);
      });

      // Subscribe to notification creation events for delivery
      eventBus.subscribe("NOTIFICATION_CREATED", async (event: DomainEvent) => {
        await this.deliverNotificationSafely(event);
      });

      // Start retry mechanism
      this.startRetryMechanism();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      this.isInitialized = true;
      logger.info("Notification system initialized with resilience features");
    } catch (error) {
      logger.error("Failed to initialize notification system", { error });
      throw error;
    }
  }

  // Main event processing with circuit breaker and retry logic
  private async processEventSafely(event: DomainEvent): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn("System shutting down, queuing event for later processing", { eventType: event.type });
      this.processingQueue.push(event);
      return;
    }

    // Check circuit breaker
    if (!this.isCircuitBreakerClosed()) {
      if (this.config.enableGracefulDegradation) {
        logger.warn("Circuit breaker open, queuing event for later", { eventType: event.type });
        this.processingQueue.push(event);
        return;
      } else {
        logger.error("Circuit breaker open, dropping event", { eventType: event.type });
        return;
      }
    }

    const eventId = this.generateEventId(event);

    try {
      // Process with timeout
      await this.withTimeout(
        this.processor.processEvent(event),
        this.config.processingTimeoutMs,
        `Processing event ${event.type}`
      );

      // Reset circuit breaker on success
      this.onProcessingSuccess();

      // Remove from failed events if it was there
      this.failedEvents.delete(eventId);

      logger.debug("Event processed successfully", { eventType: event.type, eventId });
    } catch (error) {
      logger.error("Event processing failed", { eventType: event.type, eventId, error });

      // Record circuit breaker failure
      this.onProcessingFailure();

      // Add to retry queue
      await this.handleFailedEvent(eventId, event, error as Error);
    }
  }

  // Delivery with timeout and error handling
  private async deliverNotificationSafely(event: DomainEvent): Promise<void> {
    if (!event.metadata?.receiverId || !event.metadata?.receiverType || !event.metadata?.notificationId) {
      logger.warn("Invalid notification delivery event, missing required metadata", { event });
      return;
    }

    try {
      await this.withTimeout(
        this.deliveryService.deliverNotification(
          event.metadata.receiverId,
          event.metadata.receiverType,
          event.metadata.notificationId
        ),
        this.config.deliveryTimeoutMs,
        `Delivering notification ${event.metadata.notificationId}`
      );

      logger.debug("Notification delivered successfully", {
        notificationId: event.metadata.notificationId,
        receiverId: event.metadata.receiverId,
        receiverType: event.metadata.receiverType
      });
    } catch (error) {
      logger.error("Notification delivery failed", {
        notificationId: event.metadata.notificationId,
        receiverId: event.metadata.receiverId,
        receiverType: event.metadata.receiverType,
        error
      });

      // For delivery failures, we don't retry as aggressively
      // The notification is still in the database and can be retrieved via API
      if (this.config.enableGracefulDegradation) {
        logger.info("Graceful degradation: notification available via API despite delivery failure");
      }
    }
  }

  // Circuit breaker logic
  private isCircuitBreakerClosed(): boolean {
    const now = new Date();

    switch (this.circuitBreakerState) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.circuitBreakerLastFailure &&
          now.getTime() - this.circuitBreakerLastFailure.getTime() > this.config.circuitBreaker.resetTimeoutMs) {
          this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
          logger.info("Circuit breaker transitioning to HALF_OPEN");
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private onProcessingSuccess(): void {
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.circuitBreakerState = CircuitBreakerState.CLOSED;
      this.circuitBreakerFailures = 0;
      logger.info("Circuit breaker reset to CLOSED");
    }
  }

  private onProcessingFailure(): void {
    this.circuitBreakerFailures++;
    this.circuitBreakerLastFailure = new Date();

    if (this.circuitBreakerFailures >= this.config.circuitBreaker.failureThreshold) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
      logger.warn("Circuit breaker opened due to failures", {
        failures: this.circuitBreakerFailures,
        threshold: this.config.circuitBreaker.failureThreshold
      });
    }
  }

  // Retry mechanism
  private async handleFailedEvent(eventId: string, event: DomainEvent, error: Error): Promise<void> {
    const existingFailure = this.failedEvents.get(eventId);
    const attempts = existingFailure ? existingFailure.attempts + 1 : 1;

    if (attempts > this.config.retry.maxRetries) {
      logger.error("Event exceeded max retries, moving to dead letter queue", {
        eventType: event.type,
        eventId,
        attempts
      });
      await this.moveToDeadLetterQueue(eventId, event, error);
      this.failedEvents.delete(eventId);
      return;
    }

    const delay = Math.min(
      this.config.retry.baseDelayMs * Math.pow(this.config.retry.backoffMultiplier, attempts - 1),
      this.config.retry.maxDelayMs
    );

    const nextRetry = new Date(Date.now() + delay);

    this.failedEvents.set(eventId, {
      event,
      error,
      attempts,
      lastAttempt: new Date(),
      nextRetry
    });

    logger.info("Event scheduled for retry", {
      eventType: event.type,
      eventId,
      attempts,
      nextRetry: nextRetry.toISOString(),
      delayMs: delay
    });
  }

  private startRetryMechanism(): void {
    this.retryTimer = setInterval(async () => {
      if (this.isShuttingDown) return;

      const now = new Date();
      const eventsToRetry: string[] = [];

      // Find events ready for retry
      for (const [eventId, failedEvent] of this.failedEvents.entries()) {
        if (failedEvent.nextRetry <= now) {
          eventsToRetry.push(eventId);
        }
      }

      // Process retries
      for (const eventId of eventsToRetry) {
        const failedEvent = this.failedEvents.get(eventId);
        if (failedEvent) {
          logger.info("Retrying failed event", {
            eventType: failedEvent.event.type,
            eventId,
            attempt: failedEvent.attempts + 1
          });
          await this.processEventSafely(failedEvent.event);
        }
      }

      // Process queued events if circuit breaker is closed
      if (this.isCircuitBreakerClosed() && this.processingQueue.length > 0 && !this.isProcessing) {
        await this.processQueuedEvents();
      }
    }, 5000); // Check every 5 seconds
  }

  private async processQueuedEvents(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;
    logger.info("Processing queued events", { queueSize: this.processingQueue.length });

    try {
      const events = [...this.processingQueue];
      this.processingQueue = [];

      for (const event of events) {
        if (this.isShuttingDown) {
          // Put remaining events back in queue
          this.processingQueue.unshift(...events.slice(events.indexOf(event)));
          break;
        }

        await this.processEventSafely(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Dead letter queue (could be enhanced to use external queue like Redis)
  private async moveToDeadLetterQueue(eventId: string, event: DomainEvent, error: Error): Promise<void> {
    try {
      // For now, log to a special dead letter log
      // In production, this could write to a database table or external queue
      logger.error("DEAD_LETTER_QUEUE", {
        eventId,
        event,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      });

      // Could also emit a special event for monitoring systems
      eventBus.publish({
        type: "EVENT_DEAD_LETTERED",
        targetId: eventId,
        targetType: "failed_event",
        metadata: {
          originalEventType: event.type,
          failureReason: error.message
        }
      });
    } catch (dlqError) {
      logger.error("Failed to move event to dead letter queue", { eventId, dlqError });
    }
  }

  // Utility methods
  private generateEventId(event: DomainEvent): string {
    return `${event.type}-${event.targetId}-${event.targetType}-${Date.now()}`;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // Graceful shutdown
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown of notification system`);
      this.isShuttingDown = true;

      // Stop accepting new events
      if (this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = null;
      }

      // Process remaining queued events (with timeout)
      if (this.processingQueue.length > 0) {
        logger.info(`Processing ${this.processingQueue.length} remaining queued events`);
        try {
          await this.withTimeout(this.processQueuedEvents(), 30000, "Shutdown event processing");
        } catch (error) {
          logger.error("Failed to process all queued events during shutdown", { error });
        }
      }

      // Log remaining failed events for manual recovery
      if (this.failedEvents.size > 0) {
        logger.warn("Shutdown with pending failed events", {
          failedEventCount: this.failedEvents.size,
          failedEvents: Array.from(this.failedEvents.entries()).map(([id, failure]) => ({
            id,
            eventType: failure.event.type,
            attempts: failure.attempts,
            lastError: failure.error.message
          }))
        });
      }

      logger.info("Notification system shutdown complete");
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  // Health check and monitoring
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    circuitBreakerState: CircuitBreakerState;
    failedEventCount: number;
    queuedEventCount: number;
    lastError?: string;
  } {
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      status = "unhealthy";
    } else if (this.failedEvents.size > 0 || this.processingQueue.length > 10) {
      status = "degraded";
    }

    return {
      status,
      circuitBreakerState: this.circuitBreakerState,
      failedEventCount: this.failedEvents.size,
      queuedEventCount: this.processingQueue.length,
      lastError: this.circuitBreakerLastFailure?.toISOString()
    };
  }

  // Helper method to publish events from business logic
  static publishEvent(event: Omit<DomainEvent, "createdAt">): void {
    try {
      eventBus.publish({
        ...event,
        createdAt: new Date()
      });
    } catch (error) {
      logger.error("Failed to publish event", { event, error });
      // Don't throw - business logic should continue even if notifications fail
    }
  }

  // Manual recovery methods for operations team
  async retryFailedEvent(eventId: string): Promise<boolean> {
    const failedEvent = this.failedEvents.get(eventId);
    if (!failedEvent) {
      logger.warn("Failed event not found for manual retry", { eventId });
      return false;
    }

    logger.info("Manual retry of failed event", { eventId, eventType: failedEvent.event.type });
    await this.processEventSafely(failedEvent.event);
    return true;
  }

  async clearFailedEvents(): Promise<number> {
    const count = this.failedEvents.size;
    this.failedEvents.clear();
    logger.info("Cleared all failed events", { count });
    return count;
  }

  async resetCircuitBreaker(): Promise<void> {
    this.circuitBreakerState = CircuitBreakerState.CLOSED;
    this.circuitBreakerFailures = 0;
    this.circuitBreakerLastFailure = null;
    logger.info("Circuit breaker manually reset");
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();