import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import { checkIn, checkOut, dailySummary } from "./attendance.service.js";

export const checkSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1).optional(),
    date: z.string().optional(),
  }),
});

export async function checkInHandler(req: AuthenticatedRequest, res: Response) {
  const employeeId = (req.body.employeeId as string) || req.user!.id;
  const data = await checkIn(employeeId, req.body.date);
  res.status(200).json({ attendance: data });
}

export async function checkOutHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const employeeId = (req.body.employeeId as string) || req.user!.id;
  const data = await checkOut(employeeId, req.body.date);
  res.status(200).json({ attendance: data });
}

export const summarySchema = z.object({
  query: z.object({
    date: z.string().min(1),
  }),
});

export async function summaryHandler(req: AuthenticatedRequest, res: Response) {
  const date = req.query.date as string;
  const items = await dailySummary(date);
  res.json({ items });
}
