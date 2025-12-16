import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  listJobRoles,
  getJobRole,
  createJobRole,
  updateJobRole,
  deleteJobRole
} from "./job-role.service.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import ApiResponse from "@/core/http/ApiResponse.js";
import ApiError from "@/core/http/ApiError.js";

// Validation schemas
export const createJobRoleSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Job role title is required"),
    level: z.number().int().min(1).max(10),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateJobRoleSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    level: z.number().int().min(1).max(10).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteJobRoleSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

// Controllers
export const listRoles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const jobRoles = await listJobRoles(includeInactive);
  return ApiResponse.ok(res, { jobRoles });
});

export const getRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const jobRole = await getJobRole(Number(req.params.id));
  if (!jobRole) {
    throw new ApiError({ statusCode: 404, message: "Job role not found" });
  }
  return ApiResponse.ok(res, { jobRole });
});

export const createRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const jobRole = await createJobRole(req.body);
  return ApiResponse.ok(res, { jobRole }, "Job role created successfully", 201);
});

export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const jobRole = await updateJobRole(Number(req.params.id), req.body);
  return ApiResponse.ok(res, { jobRole }, "Job role updated successfully");
});

export const deleteRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await deleteJobRole(Number(req.params.id));
  return ApiResponse.ok(res, null, "Job role deleted successfully");
});