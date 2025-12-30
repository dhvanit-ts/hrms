import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";
import ApiError from "@/core/http/ApiError.js";
import mailService from "@/infra/services/mail";
import { logger } from "@/config/logger";
import { publishEvent } from "../notification/index.js";

export type LeaveStatus = "pending" | "approved" | "rejected";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface LeaveApplicationParams {
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Validate leave application
export async function validateLeaveApplication(
  params: LeaveApplicationParams
): Promise<ValidationResult> {
  const errors: string[] = [];

  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  const now = new Date();

  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  // Check start date is not in past (Requirements 4.1)
  if (startDay < today) {
    errors.push("Start date cannot be in the past");
  }

  // Check end date is not before start date (Requirements 4.2)
  if (endDate < startDate) {
    errors.push("End date cannot be before start date");
  }

  // Check for overlapping leave applications (Requirements 4.3)
  const overlappingLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: params.employeeId,
      OR: [
        {
          // Existing leave starts during new leave period
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          // Existing leave ends during new leave period
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          // Existing leave completely encompasses new leave period
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlappingLeaves.length > 0) {
    errors.push("Leave application overlaps with existing leave request");
  }

  // Verify sufficient leave balance (Requirements 8.1, 8.3)
  const requestedDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const balance = await getLeaveBalance(params.employeeId);

  if (requestedDays > balance.remaining) {
    errors.push(
      `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${balance.remaining} days`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Apply for leave
export async function applyLeave(params: {
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  // Call validation before creating leave request (Requirements 4.1, 4.2, 4.3)
  const validation = await validateLeaveApplication(params);

  if (!validation.isValid) {
    throw new ApiError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: validation.errors.join("; "),
    });
  }

  // Set initial status to "pending" and ensure all required fields are included (Requirements 4.4, 4.5)
  const created = await prisma.leaveRequest.create({
    data: {
      employeeId: params.employeeId,
      type: params.type,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      reason: params.reason,
      status: "pending", // Explicitly set status to pending
    },
  });

  await writeAuditLog({
    action: "CREATE",
    entity: "LeaveRequest",
    entityId: created.id.toString(),
    metadata: { type: params.type },
  });

  // Publish notification event
  publishEvent({
    type: "LEAVE_REQUESTED",
    actorId: params.employeeId,
    targetId: created.id.toString(),
    targetType: "leave_request",
    metadata: {
      leaveType: params.type,
      startDate: params.startDate,
      endDate: params.endDate
    }
  });

  return created;
}

// List my leaves with optional status filtering (Requirements 5.1, 5.2, 5.3)
export async function listMyLeaves(
  employeeId: number,
  status?: LeaveStatus
) {
  return prisma.leaveRequest.findMany({
    where: {
      employeeId,
      ...(status && { status }), // Add status filter if provided
    },
    orderBy: { createdAt: "desc" }, // Ordered by submission date descending
  });
}

// List pending leaves with filters (Requirements 7.1, 7.2, 7.3, 7.4)
export async function listPendingLeaves(filters?: {
  departmentId?: number;
  startDate?: string;
  endDate?: string;
}) {
  // Build where clause
  const where: any = {
    status: "pending",
  };

  // Add department filtering (Requirements 7.3)
  if (filters?.departmentId) {
    where.employee = {
      departmentId: filters.departmentId,
    };
  }

  // Add date range filtering for overlapping leaves (Requirements 7.4)
  if (filters?.startDate || filters?.endDate) {
    const filterStart = filters.startDate ? new Date(filters.startDate) : undefined;
    const filterEnd = filters.endDate ? new Date(filters.endDate) : undefined;

    // Find leaves that overlap with the specified date range
    const dateConditions = [];

    if (filterStart && filterEnd) {
      // Both dates provided - find leaves that overlap with this range
      dateConditions.push(
        {
          // Leave starts during filter period
          startDate: {
            gte: filterStart,
            lte: filterEnd,
          },
        },
        {
          // Leave ends during filter period
          endDate: {
            gte: filterStart,
            lte: filterEnd,
          },
        },
        {
          // Leave completely encompasses filter period
          AND: [
            { startDate: { lte: filterStart } },
            { endDate: { gte: filterEnd } },
          ],
        }
      );
    } else if (filterStart) {
      // Only start date provided - find leaves that end on or after this date
      dateConditions.push({
        endDate: { gte: filterStart },
      });
    } else if (filterEnd) {
      // Only end date provided - find leaves that start on or before this date
      dateConditions.push({
        startDate: { lte: filterEnd },
      });
    }

    if (dateConditions.length > 0) {
      where.OR = dateConditions;
    }
  }

  // Fetch pending leaves with employee details (Requirements 7.1, 7.2)
  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" }, // Ordered by submission date (Requirements 7.1)
  });
}

// Approve or reject leave
export async function setLeaveStatus(params: {
  id: number;
  status: LeaveStatus;
  approverId: number;
}) {
  const updated = await prisma.leaveRequest.update({
    where: { id: params.id },
    data: {
      status: params.status,
      approverId: params.approverId,
    },
  });

  await writeAuditLog({
    action: params.status === "approved" ? "APPROVE" : "REJECT",
    entity: "LeaveRequest",
    entityId: params.id.toString(),
    performedBy: params.approverId.toString(),
  });

  return updated;
}

// Approve leave (Requirements 6.1, 6.3)
export async function approveLeave(
  leaveId: number,
  approverId: number
) {
  // Check if leave exists
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
  });

  if (!leave) {
    throw new ApiError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Leave request not found",
    });
  }

  // Check for conflicting approved leaves (Requirements 8.4)
  const conflictingLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: leave.employeeId,
      id: { not: leaveId },
      status: "approved",
      OR: [
        {
          // Existing leave starts during new leave period
          startDate: {
            gte: leave.startDate,
            lte: leave.endDate,
          },
        },
        {
          // Existing leave ends during new leave period
          endDate: {
            gte: leave.startDate,
            lte: leave.endDate,
          },
        },
        {
          // Existing leave completely encompasses new leave period
          AND: [
            { startDate: { lte: leave.startDate } },
            { endDate: { gte: leave.endDate } },
          ],
        },
      ],
    },
  });

  if (conflictingLeaves.length > 0) {
    throw new ApiError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Cannot approve leave that conflicts with already approved leave",
    });
  }

  // Update status and record approver
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: "approved",
      approverId,
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "APPROVE",
    entity: "LeaveRequest",
    entityId: leaveId.toString(),
    performedBy: approverId.toString(),
  });

  // Publish notification event
  publishEvent({
    type: "LEAVE_APPROVED",
    actorId: approverId,
    targetId: leaveId.toString(),
    targetType: "leave_request",
    metadata: {
      employeeId: leave.employeeId,
      leaveType: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString()
    }
  });

  // Trigger email notification (don't await - let it run in background)
  sendApprovalNotification(leaveId).catch((err) => {
    logger.error("Failed to send approval notification", {
      leaveId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return updated;
}

// Reject leave (Requirements 6.2, 6.4)
export async function rejectLeave(
  leaveId: number,
  approverId: number,
  reason?: string
) {
  // Check if leave exists
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
  });

  if (!leave) {
    throw new ApiError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Leave request not found",
    });
  }

  // Update status and record approver
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: "rejected",
      approverId,
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "REJECT",
    entity: "LeaveRequest",
    entityId: leaveId.toString(),
    performedBy: approverId.toString(),
    metadata: reason ? { reason } : undefined,
  });

  // Publish notification event
  publishEvent({
    type: "LEAVE_REJECTED",
    actorId: approverId,
    targetId: leaveId.toString(),
    targetType: "leave_request",
    metadata: {
      employeeId: leave.employeeId,
      leaveType: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      reason
    }
  });

  // Trigger email notification (don't await - let it run in background)
  sendRejectionNotification(leaveId, reason).catch((err) => {
    logger.error("Failed to send rejection notification", {
      leaveId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return updated;
}

// Get leave balance
export async function getLeaveBalance(
  employeeId: number,
  year: number = new Date().getFullYear()
) {
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year}-12-31T23:59:59.999Z`);

  const approved = await prisma.leaveRequest.findMany({
    where: {
      employeeId: parseInt(employeeId.toString()),
      status: "approved",
      startDate: { gte: start },
      endDate: { lte: end },
    },
  });

  const usedDays = approved.reduce((sum, r) => {
    const diff =
      Math.ceil(
        (r.endDate.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return sum + Math.max(0, diff);
  }, 0);

  const allowance = 20;
  return {
    year,
    allowance,
    usedDays,
    remaining: Math.max(0, allowance - usedDays),
  };
}

// Send approval notification (Requirements 6.3)
export async function sendApprovalNotification(
  leaveId: number
): Promise<void> {
  try {
    // Fetch leave request with employee and approver details
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        employee: true,
        approver: true,
      },
    });

    if (!leave || !leave.employee) {
      logger.error("Leave request or employee not found for notification", {
        leaveId,
      });
      return;
    }

    if (!leave.employee.email) {
      logger.warn("Employee email not found, skipping notification", {
        employeeId: leave.employeeId,
      });
      return;
    }

    // Format dates for email
    const startDate = leave.startDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const endDate = leave.endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email notification
    const result = await mailService.send(
      leave.employee.email,
      "LEAVE-APPROVED",
      {
        employeeName: leave.employee.name || "Employee",
        leaveType: leave.type,
        startDate,
        endDate,
        approverName: leave.approver?.name || "Administrator",
      }
    );

    if (!result.success) {
      logger.error("Failed to send leave approval email", {
        leaveId,
        employeeEmail: leave.employee.email,
        error: result.error,
      });
    } else {
      logger.info("Leave approval email sent successfully", {
        leaveId,
        employeeEmail: leave.employee.email,
      });
    }
  } catch (error) {
    // Log but don't throw - email failures should not block the approval process
    logger.error("Exception while sending leave approval notification", {
      leaveId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Send rejection notification (Requirements 6.4)
export async function sendRejectionNotification(
  leaveId: number,
  reason?: string
): Promise<void> {
  try {
    // Fetch leave request with employee and approver details
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        employee: true,
        approver: true,
      },
    });

    if (!leave || !leave.employee) {
      logger.error("Leave request or employee not found for notification", {
        leaveId,
      });
      return;
    }

    if (!leave.employee.email) {
      logger.warn("Employee email not found, skipping notification", {
        employeeId: leave.employeeId,
      });
      return;
    }

    // Format dates for email
    const startDate = leave.startDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const endDate = leave.endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email notification
    const result = await mailService.send(
      leave.employee.email,
      "LEAVE-REJECTED",
      {
        employeeName: leave.employee.name || "Employee",
        leaveType: leave.type,
        startDate,
        endDate,
        approverName: leave.approver?.name || "Administrator",
        reason,
      }
    );

    if (!result.success) {
      logger.error("Failed to send leave rejection email", {
        leaveId,
        employeeEmail: leave.employee.email,
        error: result.error,
      });
    } else {
      logger.info("Leave rejection email sent successfully", {
        leaveId,
        employeeEmail: leave.employee.email,
      });
    }
  } catch (error) {
    // Log but don't throw - email failures should not block the rejection process
    logger.error("Exception while sending leave rejection notification", {
      leaveId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Get employees currently on leave (today)
export async function getCurrentLeaves() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  return prisma.leaveRequest.findMany({
    where: {
      status: "approved",
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

// Get upcoming approved leaves
export async function getUpcomingLeaves(days: number = 7) {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);

  return prisma.leaveRequest.findMany({
    where: {
      status: "approved",
      startDate: {
        gte: tomorrow,
        lte: futureDate,
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
}
