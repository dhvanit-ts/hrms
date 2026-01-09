import { PostUpvotedRule } from "./notification.rules";
import { NotificationRule } from "./notification.rules-interface";

// Ticket notification rules
export const TicketCreatedRule: NotificationRule = {
  eventType: "TICKET_CREATED",

  resolveReceivers(event) {
    // Notify managers/admins who can approve tickets
    // For now, we'll need to query for managers - this is a simplified version
    // In a real implementation, you'd query the database for managers/admins
    return ["admin"]; // Placeholder - should be actual admin/manager IDs
  },

  aggregationKey(event, receiverId) {
    return `${receiverId}:TICKET_CREATED:${event.metadata?.ticketType || 'general'}`;
  }
};

export const TicketApprovedRule: NotificationRule = {
  eventType: "TICKET_APPROVED",

  resolveReceivers(event) {
    // Notify the employee who created the ticket
    return [event.metadata?.employeeId?.toString() || ""];
  },

  aggregationKey(event, receiverId) {
    return `${receiverId}:TICKET_APPROVED:${event.targetId}`;
  }
};

export const TicketRejectedRule: NotificationRule = {
  eventType: "TICKET_REJECTED",

  resolveReceivers(event) {
    // Notify the employee who created the ticket
    return [event.metadata?.employeeId?.toString() || ""];
  },

  aggregationKey(event, receiverId) {
    return `${receiverId}:TICKET_REJECTED:${event.targetId}`;
  }
};

const RULES = {
  POST_UPVOTED: PostUpvotedRule,
  TICKET_CREATED: TicketCreatedRule,
  TICKET_APPROVED: TicketApprovedRule,
  TICKET_REJECTED: TicketRejectedRule,
  // COMMENT_REPLIED: CommentRepliedRule
}

export type RuleKeys = keyof typeof RULES

export default RULES