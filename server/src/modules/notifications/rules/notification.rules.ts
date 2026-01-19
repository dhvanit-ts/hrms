import { NotificationRule, NotificationReceiver } from "./notification.rules-interface"
import db from "@/config/db"

export const PostUpvotedRule: NotificationRule = {
  eventType: "POST_UPVOTED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    return [{ id: event.metadata.postOwnerId as string, type: "user" }]
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:POST_UPVOTED:${event.targetId}`
  }
}

export const LeaveRequestedRule: NotificationRule = {
  eventType: "LEAVE_REQUESTED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get all active users and filter by roles in memory
      // This is more reliable than complex JSON queries
      const allUsers = await db.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          roles: true
        }
      });

      const adminUsers = allUsers.filter(user => {
        // Handle roles as JSON array
        const roles = Array.isArray(user.roles) ? user.roles as string[] : [];
        return roles.some(role => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].includes(role));
      });

      console.log(`Found ${adminUsers.length} admin users for leave request notification:`,
        adminUsers.map(u => ({ id: u.id, email: u.email, roles: u.roles })));

      // Convert to receiver format
      return adminUsers.map(user => ({
        id: user.id,
        type: "user" as const
      }));
    } catch (error) {
      console.error("Failed to resolve admin receivers for leave request:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:LEAVE_REQUESTED:${event.targetId}`
  }
}

export const LeaveApprovedRule: NotificationRule = {
  eventType: "LEAVE_APPROVED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get the employee ID from the event metadata
      const employeeId = event.metadata.employeeId as number;

      if (!employeeId) {
        console.error("No employeeId found in LEAVE_APPROVED event metadata");
        return [];
      }

      return [{
        id: employeeId,
        type: "employee" as const
      }];
    } catch (error) {
      console.error("Failed to resolve employee receiver for leave approval:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:LEAVE_APPROVED:${event.targetId}`
  }
}

export const LeaveRejectedRule: NotificationRule = {
  eventType: "LEAVE_REJECTED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get the employee ID from the event metadata
      const employeeId = event.metadata.employeeId as number;

      if (!employeeId) {
        console.error("No employeeId found in LEAVE_REJECTED event metadata");
        return [];
      }

      return [{
        id: employeeId,
        type: "employee" as const
      }];
    } catch (error) {
      console.error("Failed to resolve employee receiver for leave rejection:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:LEAVE_REJECTED:${event.targetId}`
  }
}

export const AttendanceCorrectionRequestedRule: NotificationRule = {
  eventType: "ATTENDANCE_CORRECTION_REQUESTED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get all active users and filter by roles in memory
      const allUsers = await db.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          roles: true
        }
      });

      const adminUsers = allUsers.filter(user => {
        // Handle roles as JSON array
        const roles = Array.isArray(user.roles) ? user.roles as string[] : [];
        return roles.some(role => ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].includes(role));
      });

      console.log(`Found ${adminUsers.length} admin users for attendance correction notification:`,
        adminUsers.map(u => ({ id: u.id, email: u.email, roles: u.roles })));

      // Convert to receiver format
      return adminUsers.map(user => ({
        id: user.id,
        type: "user" as const
      }));
    } catch (error) {
      console.error("Failed to resolve admin receivers for attendance correction request:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:ATTENDANCE_CORRECTION_REQUESTED:${event.targetId}`
  }
}

export const AttendanceCorrectionApprovedRule: NotificationRule = {
  eventType: "ATTENDANCE_CORRECTION_APPROVED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get the employee ID from the event metadata
      const employeeId = event.metadata.employeeId as number;

      if (!employeeId) {
        console.error("No employeeId found in ATTENDANCE_CORRECTION_APPROVED event metadata");
        return [];
      }

      return [{
        id: employeeId,
        type: "employee" as const
      }];
    } catch (error) {
      console.error("Failed to resolve employee receiver for attendance correction approval:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:ATTENDANCE_CORRECTION_APPROVED:${event.targetId}`
  }
}

export const AttendanceCorrectionRejectedRule: NotificationRule = {
  eventType: "ATTENDANCE_CORRECTION_REJECTED",

  async resolveReceivers(event): Promise<NotificationReceiver[]> {
    try {
      // Get the employee ID from the event metadata
      const employeeId = event.metadata.employeeId as number;

      if (!employeeId) {
        console.error("No employeeId found in ATTENDANCE_CORRECTION_REJECTED event metadata");
        return [];
      }

      return [{
        id: employeeId,
        type: "employee" as const
      }];
    } catch (error) {
      console.error("Failed to resolve employee receiver for attendance correction rejection:", error);
      return [];
    }
  },

  aggregationKey(event, receiverId) {
    return `${receiverId.type}_${receiverId.id}:ATTENDANCE_CORRECTION_REJECTED:${event.targetId}`
  }
}