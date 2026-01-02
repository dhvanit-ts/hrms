import db from "../../config/db.js";
import type { NotificationState } from "@prisma/client";

export interface NotificationReadModel {
  id: number;
  type: string;
  targetId: string;
  targetType: string;
  actors: string[];
  count: number;
  state: NotificationState;
  createdAt: Date;
  updatedAt: Date;
  message: string;
}

export class NotificationService {
  async getNotifications(
    receiverId: number,
    receiverType: "employee" | "user",
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    notifications: NotificationReadModel[];
    total: number;
    unreadCount: number;
  }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const where = {
      receiverId,
      receiverType,
      ...(unreadOnly && { state: "unread" as const })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          receiverId,
          receiverType,
          state: "unread"
        }
      })
    ]);

    const readModels = notifications.map(notification => ({
      ...notification,
      actors: Array.isArray(notification.actors) ? notification.actors as string[] : [],
      message: this.generateMessage(notification)
    }));

    return {
      notifications: readModels,
      total,
      unreadCount
    };
  }

  async markAsDelivered(notificationIds: number[]): Promise<void> {
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        state: "unread"
      },
      data: {
        state: "delivered",
        deliveredAt: new Date()
      }
    });
  }

  async markAsSeen(notificationIds: number[]): Promise<void> {
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        state: { in: ["unread", "delivered"] }
      },
      data: {
        state: "seen",
        seenAt: new Date()
      }
    });
  }

  async markAllAsSeen(receiverId: number, receiverType: "employee" | "user"): Promise<void> {
    await db.notification.updateMany({
      where: {
        receiverId,
        receiverType,
        state: { in: ["unread", "delivered"] }
      },
      data: {
        state: "seen",
        seenAt: new Date()
      }
    });
  }

  private generateMessage(notification: any): string {
    const actors = Array.isArray(notification.actors) ? notification.actors as string[] : [];
    const count = notification.count;
    const type = notification.type;

    // Generate human-readable messages based on notification type
    switch (type) {
      case "LEAVE_REQUESTED":
        if (count === 1) {
          return actors.length > 0
            ? `${actors[0]} requested leave`
            : "New leave request submitted";
        }
        return `${count} new leave requests submitted`;

      case "LEAVE_APPROVED":
        return "Your leave request has been approved";

      case "LEAVE_REJECTED":
        return "Your leave request has been rejected";

      case "EMPLOYEE_CREATED":
        if (count === 1) {
          return actors.length > 0
            ? `New employee ${actors[0]} has been added`
            : "New employee has been added";
        }
        return `${count} new employees have been added`;

      case "ATTENDANCE_MISSED":
        if (count === 1) {
          return actors.length > 0
            ? `${actors[0]} missed attendance`
            : "Employee missed attendance";
        }
        return `${count} employees missed attendance`;

      default:
        return `${type.toLowerCase().replace(/_/g, " ")}`;
    }
  }
}