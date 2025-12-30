import type { DomainEvent } from "@/infra/services/event-bus.js";
import db from "@/config/db.js";
import { logger } from "@/config/logger.js";
import { notificationRules } from "./notification.rules.js";

export class NotificationProcessor {
  async processEvent(event: DomainEvent): Promise<void> {
    try {
      // Store the event first
      const storedEvent = await this.storeEvent(event);

      // Get the rule for this event type
      const rule = notificationRules[event.type];
      if (!rule) {
        logger.debug("No notification rule found for event type", { type: event.type });
        return;
      }

      // Resolve who should receive notifications
      const receivers = await rule.receiverResolver(event);

      // Create/update notifications for each receiver
      for (const receiver of receivers) {
        await this.upsertNotification(event, receiver, rule);
      }

      logger.info("Processed notification event", {
        eventType: event.type,
        receiverCount: receivers.length
      });
    } catch (error) {
      logger.error("Failed to process notification event", { event, error });
    }
  }

  private async storeEvent(event: DomainEvent): Promise<any> {
    return db.event.create({
      data: {
        type: event.type,
        actorId: event.actorId,
        targetId: event.targetId,
        targetType: event.targetType,
        metadata: event.metadata || {}
      }
    });
  }

  private async upsertNotification(
    event: DomainEvent,
    receiver: { id: number; type: "employee" | "user" },
    rule: typeof notificationRules[string]
  ): Promise<void> {
    const aggregationKey = rule.aggregationKey(event, receiver.id, receiver.type);
    const now = new Date();
    let notificationId: number;

    // Try to find existing notification within aggregation window
    const windowStart = new Date(now.getTime() - rule.aggregationWindowMs);

    const existingNotification = await db.notification.findUnique({
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
      await this.updateNotification(existingNotification.id, event);
      notificationId = existingNotification.id;
    } else {
      // Create new notification
      const newNotification = await this.createNotification(event, receiver, aggregationKey);
      notificationId = newNotification.id;
    }

    // Publish delivery event
    const { eventBus } = await import("../../infra/services/event-bus.js");
    eventBus.publish({
      type: "NOTIFICATION_CREATED",
      targetId: notificationId.toString(),
      targetType: "notification",
      metadata: {
        receiverId: receiver.id,
        receiverType: receiver.type,
        notificationId
      }
    });
  }

  private async updateNotification(notificationId: number, event: DomainEvent): Promise<void> {
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) return;

    // Get actor name for display
    const actorName = await this.getActorName(event.actorId);
    const currentActors = Array.isArray(notification.actors) ? notification.actors as string[] : [];

    // Add new actor if not already present
    const updatedActors = actorName && !currentActors.includes(actorName)
      ? [...currentActors, actorName]
      : currentActors;

    await db.notification.update({
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
  }

  private async createNotification(
    event: DomainEvent,
    receiver: { id: number; type: "employee" | "user" },
    aggregationKey: string
  ): Promise<{ id: number }> {
    const actorName = await this.getActorName(event.actorId);

    return db.notification.create({
      data: {
        receiverId: receiver.id,
        receiverType: receiver.type,
        type: event.type,
        targetId: event.targetId,
        targetType: event.targetType,
        actors: actorName ? [actorName] : [],
        count: 1,
        state: "unread",
        aggregationKey
      }
    });
  }

  private async getActorName(actorId?: number): Promise<string | null> {
    if (!actorId) return null;

    // Try employee first
    const employee = await db.employee.findUnique({
      where: { id: actorId },
      select: { name: true }
    });

    if (employee) return employee.name;

    // Try user
    const user = await db.user.findUnique({
      where: { id: actorId },
      select: { email: true }
    });

    return user?.email || null;
  }
}