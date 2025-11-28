import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";

export type LeaveStatus = "pending" | "approved" | "rejected";

// Apply for leave
export async function applyLeave(params: {
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const created = await prisma.leaveRequest.create({
    data: {
      employeeId: params.employeeId,
      type: params.type,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      reason: params.reason,
    },
  });

  await writeAuditLog({
    action: "CREATE",
    entity: "LeaveRequest",
    entityId: created.id.toString(),
    metadata: { type: params.type },
  });

  return created;
}

// List my leaves
export async function listMyLeaves(employeeId: number) {
  return prisma.leaveRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
}

// List pending leaves
export async function listPendingLeaves() {
  return prisma.leaveRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
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
