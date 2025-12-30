import { eventBus, type DomainEvent } from "../../infra/services/event-bus.js";
import { NotificationProcessor } from "./notification.processor.js";
import { NotificationDeliveryService } from "./notification.delivery.js";
import { logger } from "@/config/logger.js";
import type { Server as SocketIOServer } from "socket.io";

export class NotificationSystem {
  private processor = new NotificationProcessor();
  private deliveryService = new NotificationDeliveryService();
  private isInitialized = false;

  initialize(io?: SocketIOServer): void {
    if (this.isInitialized) {
      logger.warn("Notification system already initialized");
      return;
    }

    // Set up socket server if provided
    if (io) {
      this.deliveryService.setSocketServer(io);
    }

    // Subscribe to all domain events
    eventBus.subscribeToAll(async (event: DomainEvent) => {
      await this.processor.processEvent(event);
    });

    // Subscribe to notification creation events for delivery
    eventBus.subscribe("NOTIFICATION_CREATED", async (event: DomainEvent) => {
      if (event.metadata?.receiverId && event.metadata?.receiverType && event.metadata?.notificationId) {
        await this.deliveryService.deliverNotification(
          event.metadata.receiverId,
          event.metadata.receiverType,
          event.metadata.notificationId
        );
      }
    });

    this.isInitialized = true;
    logger.info("Notification system initialized");
  }

  // Helper method to publish events from business logic
  static publishEvent(event: Omit<DomainEvent, "createdAt">): void {
    eventBus.publish({
      ...event,
      createdAt: new Date()
    });
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();