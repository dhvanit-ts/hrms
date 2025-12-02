import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  listMyLeaves,
  listPendingLeaves,
  type LeaveStatus,
} from "@/modules/leave/leave.service";

// Validation schema for POST /api/leaves
export const applyLeaveSchema = z.object({
  body: z.object({
    type: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
  }),
});

// Handler for POST /api/leaves - Apply for leave
export async function applyLeaveHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  // Use authenticated employee ID from token
  const employeeId = Number(req.user!.id);

  const created = await applyLeave({
    employeeId,
    type: req.body.type,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    reason: req.body.reason,
  });

  res.status(201).json({ leave: created });
}

// Handler for GET /api/leaves/my-leaves - Get employee's leave history with optional status filtering
export async function myLeavesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  // Use authenticated employee ID from token
  const employeeId = Number(req.user!.id);

  // Optional status filter
  const status = req.query.status as LeaveStatus | undefined;

  const items = await listMyLeaves(employeeId, status);
  res.json({ leaves: items });
}

// Handler for GET /api/leaves/balance - Get employee's leave balance
export async function leaveBalanceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  // Use authenticated employee ID from token
  const employeeId = Number(req.user!.id);

  // Optional year filter
  const year = req.query.year ? Number(req.query.year) : undefined;

  const balance = await getLeaveBalance(employeeId, year);
  res.json({ balance });
}

// Handler for GET /api/leaves/pending - Get all pending leave requests (admin only)
export async function pendingLeavesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  // Extract query parameters for filtering
  const filters = {
    departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };

  const items = await listPendingLeaves(filters);
  res.json({ leaves: items });
}

// Validation schema for PATCH /api/leaves/:id/approve
export const approveLeaveSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Leave ID is required"),
  }),
});

// Handler for PATCH /api/leaves/:id/approve - Approve leave request (admin only)
export async function approveLeaveHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const leaveId = Number(req.params.id);
  const approverId = Number(req.user!.id);

  const updated = await approveLeave(leaveId, approverId);
  res.json({ leave: updated });
}

// Validation schema for PATCH /api/leaves/:id/reject
export const rejectLeaveSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Leave ID is required"),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

// Handler for PATCH /api/leaves/:id/reject - Reject leave request (admin only)
export async function rejectLeaveHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const leaveId = Number(req.params.id);
  const approverId = Number(req.user!.id);
  const reason = req.body.reason;

  const updated = await rejectLeave(leaveId, approverId, reason);
  res.json({ leave: updated });
}
