import { DomainEvent } from "./notification.interface";
import { upsertNotification } from "./notification.upsert";
import notifyViaSSE from "./notifyUserViaSSE";
import RULES from "./rules";
import { NotificationService } from "./notification.service";

const notificationService = new NotificationService();

export async function handleEvent(event: DomainEvent) {
  const rule = RULES[event.type];
  if (!rule) return;

  const receivers = rule.resolveReceivers(event);

  for (const receiverId of receivers) {
    const aggregationKey = rule.aggregationKey(event, receiverId);

    // Upsert the notification in the database
    const notification = await upsertNotification(
      event,
      receiverId,
      aggregationKey
    );

    if (notification) {
      // Generate the human-readable message
      const message = generateMessage(notification);

      // Create the notification data to send via SSE
      const notificationData = {
        notification: {
          id: notification.id,
          type: notification.type,
          targetId: notification.targetId,
          targetType: notification.targetType,
          actors: Array.isArray(notification.actors) ? notification.actors as string[] : [],
          count: notification.count,
          state: notification.state,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString(),
          message
        }
      };

      // Send notification via SSE with the actual notification data
      // Handle both string (admin) and number (employee) IDs
      const userId = receiverId.type === 'user' ? receiverId.id.toString() : receiverId.id;
      notifyViaSSE(`${receiverId.type}_${userId}`, aggregationKey, notificationData);
    }
  }
}

// Helper function to generate human-readable messages (copied from NotificationService)
function generateMessage(notification: any): string {
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

    case "TICKET_CREATED":
      if (count === 1) {
        return actors.length > 0
          ? `${actors[0]} created a new ticket`
          : "New ticket created";
      }
      return `${count} new tickets created`;

    case "TICKET_APPROVED":
      return "Your ticket has been approved";

    case "TICKET_REJECTED":
      return "Your ticket has been rejected";

    default:
      return `${type.toLowerCase().replace(/_/g, " ")}`;
  }
}
