import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  applyLeave,
  getLeaveBalance,
  listMyLeaves,
  listPendingLeaves,
  setLeaveStatus,
} from "@/modules/leave/leave.service";

export const applyLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    type: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().optional(),
  }),
});

export async function applyLeaveHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const created = await applyLeave(req.body);
  res.status(201).json({ leave: created });
}

export async function myLeavesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const employeeId = (req.query.employeeId as string) || req.user!.id;
  const items = await listMyLeaves(parseInt(employeeId));
  res.json({ leaves: items });
}

export async function pendingLeavesHandler(
  _req: AuthenticatedRequest,
  res: Response
) {
  const items = await listPendingLeaves();
  res.json({ leaves: items });
}

export const approveRejectSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(["approved", "rejected"]),
  }),
});

export async function approveRejectHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const updated = await setLeaveStatus({
    id: Number(req.params.id),
    status: req.body.status,
    approverId: Number(req.user!.id),
  });
  res.json({ leave: updated });
}

export async function leaveBalanceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const employeeId = (req.query.employeeId as string) || req.user!.id;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const balance = await getLeaveBalance(Number(employeeId), year);
  res.json({ balance });
}
