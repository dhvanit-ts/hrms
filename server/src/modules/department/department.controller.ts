import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "./department.service.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import ApiResponse from "@/core/http/ApiResponse.js";
import ApiError from "@/core/http/ApiError.js";

// Validation schemas
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Department name is required"),
    description: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const deleteDepartmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

// Controllers
export const listDept = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const departments = await listDepartments();
  return ApiResponse.ok(res, { departments });
});

export const getDept = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await getDepartment(Number(req.params.id));
  if (!department) {
    throw new ApiError({ statusCode: 404, message: "Department not found" });
  }
  return ApiResponse.ok(res, { department });
});

export const createDept = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await createDepartment(req.body);
  return ApiResponse.ok(res, { department }, "Department created successfully", 201);
});

export const updateDept = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await updateDepartment(Number(req.params.id), req.body);
  return ApiResponse.ok(res, { department }, "Department updated successfully");
});

export const deleteDept = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await deleteDepartment(Number(req.params.id));
  return ApiResponse.ok(res, null, "Department deleted successfully");
});