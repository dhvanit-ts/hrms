import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import { checkIn, checkOut, dailySummary, getAttendanceHistory, getTodayStatus } from "./attendance.service.js";

export const checkSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1).optional(),
    date: z.string().optional(),
  }),
});

export const checkInHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = (req.body.employeeId as string) || req.user!.id;

  // Extract IP address from request
  // Check X-Forwarded-For header first (for proxied requests), then fall back to socket address
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || '127.0.0.1';

  const data = await checkIn(employeeId, ipAddress, req.body.date);
  res.status(200).json({ attendance: data });
});

export const checkOutHandler = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const employeeId = (req.body.employeeId as string) || req.user!.id;
  const data = await checkOut(employeeId, req.body.date);
  res.status(200).json({ attendance: data });
});

export const summarySchema = z.object({
  query: z.object({
    date: z.string().min(1),
  }),
});

export const summaryHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = req.query.date as string;
  const items = await dailySummary(date);
  res.json({ items });
});

export const historySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const historyHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = req.user!.id;
  const filters = {
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };

  const attendances = await getAttendanceHistory(employeeId, filters);
  res.status(200).json({ attendances });
});

export const todayStatusHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = req.user!.id;
  const status = await getTodayStatus(employeeId);
  res.status(200).json(status);
});
