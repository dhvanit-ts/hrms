import type { DomainEvent } from "@/infra/services/event-bus.js";
import db from "@/config/db.js";
import { logger } from "@/config/logger.js";
import { notificationRules } from "./notification.rules.js";

interface ProcessingResult {
  success: boolean;
  notificationIds: number[];
  error?: Error;
}

export class NotificationProcessor {
  private readonly processingTimeoutMs = 25000; // Slightly less than system timeout
  private readonly maxConcurrentProcessing = 10;
  private currentlyProcessing = new Set<string>();

  async processEvent(event: DomainEvent): Promise<ProcessingResult> {
    const eventKey = this.getEventKey(event);

    // Prevent duplicate processing of the same event
    if (this.currentlyProcessing.has(eventKey)) {
      logger.warn("Event already being processed, skipping duplicate", {
        eventType: event.type,
        eventKey
      });
      return { success: false, notificationIds: [], error: new Error("Duplicate processing") };
    }

    // Check concurrent processing limit
    if (this.currentlyProcessing.size >= this.maxConcurrentProcessing) {
      logger.warn("Max concurrent processing limit reached, rejecting event", {
        eventType: event.type,
        currentCount: this.currentlyProcessing.size,
        limit: this.maxConcurrentProcessing
      });
      return {
        success: false,
        notificationIds: [],
        error: new Error("Processing capacity exceeded")
      };
    }

    this.currentlyProcessing.add(eventKey);

    try {
      return await this.withTimeout(
        this.processEventInternal(event),
        this.processingTimeoutMs,
        `Processing event ${event.type}`
      );
    } finally {
      this.currentlyProcessing.delete(eventKey);
    }
  }

  private async processEventInternal(event: DomainEvent): Promise<ProcessingResult> {
    const notificationIds: number[] = [];

    try {
      // Store the event first (idempotent)
      const storedEvent = await this.storeEventSafely(event);
      if (!storedEvent) {
        logger.warn("Failed to store event, continuing with processing", {
          eventType: event.type
        });
      }

      // Get the rule for this event type
      const rule = notificationRules[event.type];
      if (!rule) {
        logger.debug("No notification rule found for event type", { type: event.type });
        return { success: true, notificationIds: [] };
      }

      // Resolve who should receive notifications with error handling
      let receivers: Array<{ id: number; type: "employee" | "user" }>;
      try {
        receivers = await this.withTimeout(
          rule.receiverResolver(event),
          10000,
          `Resolving receivers for ${event.type}`
        );
      } catch (error) {
        logger.error("Failed to resolve notification receivers", {
          eventType: event.type,
          error
        });
        return {
          success: false,
          notificationIds: [],
          error: error as Error
        };
      }

      if (receivers.length === 0) {
        logger.debug("No receivers found for event", { eventType: event.type });
        return { success: true, notificationIds: [] };
      }

      // Create/update notifications for each receiver
      const processingPromises = receivers.map(receiver =>
        this.upsertNotificationSafely(event, receiver, rule)
      );

      const results = await Promise.allSettled(processingPromises);

      // Collect successful notification IDs and log failures
      let hasFailures = false;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const receiver = receivers[i];

        if (result.status === "fulfilled" && result.value) {
          notificationIds.push(result.value);
        } else {
          hasFailures = true;
          const error = result.status === "rejected" ? result.reason : "Unknown error";
          logger.error("Failed to create notification for receiver", {
            eventType: event.type,
            receiverId: receiver.id,
            receiverType: receiver.type,
            error
          });
        }
      }

      logger.info("Processed notification event", {
        eventType: event.type,
        totalReceivers: receivers.length,
        successfulNotifications: notificationIds.length,
        hasFailures
      });

      return {
        success: !hasFailures || notificationIds.length > 0, // Partial success is still success
        notificationIds
      };

    } catch (error) {
      logger.error("Failed to process notification event", {
        eventType: event.type,
        error
      });
      return {
        success: false,
        notificationIds,
        error: error as Error
      };
    }
  }

  private async storeEventSafely(event: DomainEvent): Promise<any | null> {
    try {
      // Check if event already exists (idempotent storage)
      const existingEvent = await db.event.findFirst({
        where: {
          type: event.type,
          targetId: event.targetId,
          targetType: event.targetType,
          actorId: event.actorId || null,
          createdAt: event.createdAt
        }
      });

      if (existingEvent) {
        logger.debug("Event already stored", {
          eventType: event.type,
          eventId: existingEvent.id
        });
        return existingEvent;
      }

      return await db.event.create({
        data: {
          type: event.type,
          actorId: event.actorId,
          targetId: event.targetId,
          targetType: event.targetType,
          metadata: event.metadata || {},
          createdAt: event.createdAt || new Date()
        }
      });
    } catch (error) {
      logger.error("Failed to store event", { event, error });
      return null;
    }
  }

  private async upsertNotificationSafely(
    event: DomainEvent,
    receiver: { id: number; type: "employee" | "user" },
    rule: typeof notificationRules[string]
  ): Promise<number | null> {
    try {
      const aggregationKey = rule.aggregationKey(event, receiver.id, receiver.type);
      const now = new Date();

      // Use database transaction for consistency
      return await db.$transaction(async (tx) => {
        // Try to find existing notification within aggregation window
        const windowStart = new Date(now.getTime() - rule.aggregationWindowMs);

        const existingNotification = await tx.notification.findUnique({
          where: {
            receiverId_receiverType_aggregationKey: {
              receiverId: receiver.id,
              receiverType: receiver.type,
              aggregationKey
            }
          }
        });

        if (existingNotification && existingNotification.createdAt > windowStart) {
          // Update existing notification
          const updatedNotification = await this.updateNotificationSafely(
            tx,
            existingNotification.id,
            event
          );
          return updatedNotification?.id || null;
        } else {
          // Create new notification
          const newNotification = await this.createNotificationSafely(
            tx,
            event,
            receiver,
            aggregationKey
          );
          return newNotification?.id || null;
        }
      }, {
        timeout: 15000, // 15 second transaction timeout
        maxWait: 5000,  // 5 second wait for connection
      });

    } catch (error) {
      logger.error("Failed to upsert notification", {
        eventType: event.type,
        receiverId: receiver.id,
        receiverType: receiver.type,
        error
      });
      return null;
    }
  }

  private async updateNotificationSafely(
    tx: any,
    notificationId: number,
    event: DomainEvent
  ): Promise<{ id: number } | null> {
    try {
      const notification = await tx.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        logger.warn("Notification not found for update", { notificationId });
        return null;
      }

      // Get actor name for display
      const actorName = await this.getActorNameSafely(event.actorId);
      const currentActors = Array.isArray(notification.actors) ? notification.actors as string[] : [];

      // Add new actor if not already present
      const updatedActors = actorName && !currentActors.includes(actorName)
        ? [...currentActors, actorName]
        : currentActors;

      const updatedNotification = await tx.notification.update({
        where: { id: notificationId },
        data: {
          actors: updatedActors,
          count: notification.count + 1,
          updatedAt: new Date(),
          // Reset delivery state for updated notifications
          state: "unread",
          deliveredAt: null
        }
      });

      logger.debug("Notification updated successfully", {
        notificationId,
        newCount: updatedNotification.count
      });

      return updatedNotification;
    } catch (error) {
      logger.error("Failed to update notification", { notificationId, error });
      return null;
    }
  }

  private async createNotificationSafely(
    tx: any,
    event: DomainEvent,
    receiver: { id: number; type: "employee" | "user" },
    aggregationKey: string
  ): Promise<{ id: number } | null> {
    try {
      const actorName = await this.getActorNameSafely(event.actorId);

      const newNotification = await tx.notification.create({
        data: {
          receiverId: receiver.id,
          receiverType: receiver.type,
          type: event.type,
          targetId: event.targetId,
          targetType: event.targetType,
          actors: actorName ? [actorName] : [],
          count: 1,
          state: "unread",
          aggregationKey,
          createdAt: new Date()
        }
      });

      logger.debug("Notification created successfully", {
        notificationId: newNotification.id,
        receiverId: receiver.id,
        receiverType: receiver.type
      });

      // Publish delivery event asynchronously
      setImmediate(() => {
        this.publishDeliveryEvent(newNotification.id, receiver);
      });

      return newNotification;
    } catch (error) {
      logger.error("Failed to create notification", {
        eventType: event.type,
        receiverId: receiver.id,
        receiverType: receiver.type,
        error
      });
      return null;
    }
  }

  private async getActorNameSafely(actorId?: number): Promise<string | null> {
    if (!actorId) return null;

    try {
      // Try employee first
      const employee = await db.employee.findUnique({
        where: { id: actorId },
        select: { name: true }
      });

      if (employee?.name) return employee.name;

      // Try user
      const user = await db.user.findUnique({
        where: { id: actorId },
        select: { email: true }
      });

      return user?.email || null;
    } catch (error) {
      logger.warn("Failed to get actor name", { actorId, error });
      return null;
    }
  }

  private publishDeliveryEvent(
    notificationId: number,
    receiver: { id: number; type: "employee" | "user" }
  ): void {
    try {
      const { eventBus } = require("../../infra/services/event-bus.js");
      eventBus.publish({
        type: "NOTIFICATION_CREATED",
        targetId: notificationId.toString(),
        targetType: "notification",
        metadata: {
          receiverId: receiver.id,
          receiverType: receiver.type,
          notificationId
        },
        createdAt: new Date()
      });
    } catch (error) {
      logger.error("Failed to publish delivery event", {
        notificationId,
        receiverId: receiver.id,
        receiverType: receiver.type,
        error
      });
    }
  }

  private getEventKey(event: DomainEvent): string {
    return `${event.type}-${event.targetId}-${event.targetType}-${event.actorId || 'null'}`;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // Health check method
  getProcessingStats(): {
    currentlyProcessing: number;
    maxConcurrentProcessing: number;
    processingKeys: string[];
  } {
    return {
      currentlyProcessing: this.currentlyProcessing.size,
      maxConcurrentProcessing: this.maxConcurrentProcessing,
      processingKeys: Array.from(this.currentlyProcessing)
    };
  }
}