import type { DomainEvent } from "@/infra/services/event-bus.js";
import db from "@/config/db.js";

export interface NotificationRule {
  eventType: string;
  receiverResolver: (event: DomainEvent) => Promise<Array<{ id: number; type: "employee" | "user" }>>;
  aggregationKey: (event: DomainEvent, receiverId: number, receiverType: string) => string;
  aggregationWindowMs: number;
}

// Helper functions for common receiver patterns
const getAllAdmins = async () => {
  const adminUsers = await db.user.findMany({
    where: {
      isActive: true
    }
  });

  // Filter admin users in JavaScript since JSON queries can be database-specific
  return adminUsers.filter(user => {
    try {
      const roles = Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles as string);
      return roles.includes("ADMIN");
    } catch {
      return false;
    }
  }).map(user => ({ id: user.id, type: "user" as const }));
};

const getAllManagers = async () => {
  const managerUsers = await db.user.findMany({
    where: {
      isActive: true
    }
  });

  // Filter manager users in JavaScript
  return managerUsers.filter(user => {
    try {
      const roles = Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles as string);
      return roles.includes("MANAGER");
    } catch {
      return false;
    }
  }).map(user => ({ id: user.id, type: "user" as const }));
};

const getEmployeeManagers = async (employeeId: number) => {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: {
        include: { manager: true }
      }
    }
  });

  const receivers: Array<{ id: number; type: "employee" | "user" }> = [];

  // Add department manager if exists
  if (employee?.department?.manager) {
    receivers.push({ id: employee.department.manager.id, type: "employee" });
  }

  // Add all admin users
  const admins = await getAllAdmins();
  receivers.push(...admins);

  // Add all manager users (HR managers, etc.)
  const managers = await getAllManagers();
  receivers.push(...managers);

  return receivers;
};

const getEmployee = async (employeeId: number) => {
  return [{ id: employeeId, type: "employee" as const }];
};

// Notification rules configuration
export const notificationRules: Record<string, NotificationRule> = {
  LEAVE_REQUESTED: {
    eventType: "LEAVE_REQUESTED",
    receiverResolver: async (event) => {
      const leaveRequest = await db.leaveRequest.findUnique({
        where: { id: parseInt(event.targetId) },
        include: { employee: true }
      });

      if (!leaveRequest) return [];

      return getEmployeeManagers(leaveRequest.employeeId);
    },
    aggregationKey: (event, receiverId, receiverType) =>
      `${receiverId}:${receiverType}:LEAVE_REQUESTED`,
    aggregationWindowMs: 60 * 60 * 1000 // 1 hour
  },

  LEAVE_APPROVED: {
    eventType: "LEAVE_APPROVED",
    receiverResolver: async (event) => {
      const leaveRequest = await db.leaveRequest.findUnique({
        where: { id: parseInt(event.targetId) }
      });

      if (!leaveRequest) return [];

      return getEmployee(leaveRequest.employeeId);
    },
    aggregationKey: (event, receiverId, receiverType) =>
      `${receiverId}:${receiverType}:LEAVE_APPROVED:${event.targetId}`,
    aggregationWindowMs: 5 * 60 * 1000 // 5 minutes
  },

  LEAVE_REJECTED: {
    eventType: "LEAVE_REJECTED",
    receiverResolver: async (event) => {
      const leaveRequest = await db.leaveRequest.findUnique({
        where: { id: parseInt(event.targetId) }
      });

      if (!leaveRequest) return [];

      return getEmployee(leaveRequest.employeeId);
    },
    aggregationKey: (event, receiverId, receiverType) =>
      `${receiverId}:${receiverType}:LEAVE_REJECTED:${event.targetId}`,
    aggregationWindowMs: 5 * 60 * 1000 // 5 minutes
  },

  EMPLOYEE_CREATED: {
    eventType: "EMPLOYEE_CREATED",
    receiverResolver: async (event) => {
      const employee = await db.employee.findUnique({
        where: { id: parseInt(event.targetId) }
      });

      if (!employee) return [];

      // Notify managers and admins
      return getEmployeeManagers(employee.id);
    },
    aggregationKey: (event, receiverId, receiverType) =>
      `${receiverId}:${receiverType}:EMPLOYEE_CREATED`,
    aggregationWindowMs: 30 * 60 * 1000 // 30 minutes
  },

  ATTENDANCE_MISSED: {
    eventType: "ATTENDANCE_MISSED",
    receiverResolver: async (event) => {
      const employeeId = parseInt(event.targetId);
      return getEmployeeManagers(employeeId);
    },
    aggregationKey: (event, receiverId, receiverType) =>
      `${receiverId}:${receiverType}:ATTENDANCE_MISSED`,
    aggregationWindowMs: 24 * 60 * 60 * 1000 // 24 hours
  }
};