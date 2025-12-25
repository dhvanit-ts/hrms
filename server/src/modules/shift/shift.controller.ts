import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignEmployeesToShift,
  removeEmployeesFromShift,
  getShiftSchedule,
  updateDefaultShiftHandler,
} from "./shift.service.js";

const shiftIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)),
})

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Shift name is required").max(100, "Shift name too long"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
    breakTime: z.number().min(0).max(480).optional(), // Max 8 hours break
    description: z.string().max(500).optional(),
  }),
});

export const createShiftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shift = await createShift(req.body, req.user!.id.toString());
  res.status(201).json({ shift });
});

export const getAllShiftsSchema = z.object({
  query: z.object({
    includeInactive: z.string().optional().transform(val => val === 'true'),
  }),
});

export const getAllShiftsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { includeInactive } = req.query as { includeInactive?: boolean };
  const shifts = await getAllShifts(includeInactive);
  res.json({ shifts });
});

export const getShiftByIdSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val, 10)),
  }),
});

export const getShiftByIdHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const shift = await getShiftById(parseInt(id, 10));
  res.json({ shift });
});

export const updateDefaultShiftSchema = z.object({
  params: shiftIdSchema
})

export const updateShiftSchema = z.object({
  params: shiftIdSchema,
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    breakTime: z.number().min(0).max(480).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateShiftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const shift = await updateShift(parseInt(id, 10), req.body, req.user!.id.toString());
  res.json({ shift });
});

export const deleteShiftSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val, 10)),
  }),
});

export const deleteShiftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const shift = await deleteShift(parseInt(id, 10), req.user!.id.toString());
  res.json({ shift });
});

export const assignEmployeesSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val, 10)),
  }),
  body: z.object({
    employeeIds: z.array(z.number()).min(1, "At least one employee ID is required"),
  }),
});

export const assignEmployeesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const { employeeIds } = req.body;
  const result = await assignEmployeesToShift(parseInt(id, 10), employeeIds, req.user!.id.toString());
  res.json(result);
});

export const updateDefaultShift = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string }
  const result = await updateDefaultShiftHandler(parseInt(id, 10), req.user.id.toString())
  res.json(result)
})

export const removeEmployeesSchema = z.object({
  body: z.object({
    employeeIds: z.array(z.number()).min(1, "At least one employee ID is required"),
  }),
});

export const removeEmployeesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { employeeIds } = req.body;
  const result = await removeEmployeesFromShift(employeeIds, req.user!.id.toString());
  res.json(result);
});

export const getScheduleSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const getScheduleHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const schedule = await getShiftSchedule(startDate, endDate);
  res.json({ schedule });
});