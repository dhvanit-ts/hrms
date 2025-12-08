import type { Response } from "express";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  updateOwnProfile,
  assignRoles,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from "@/modules/user/user.service.js";
import { z } from "zod";
import type { AppRole } from "@/config/constants.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import ApiResponse from "@/core/http/ApiResponse.js";

export async function me(req: AuthenticatedRequest, res: Response) {
  res.json({ user: req.user });
}

export const updateMeSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  const updated = await updateOwnProfile(Number(req.user!.id), req.body);
  res.json({ user: updated });
}

export const assignRolesSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    roles: z.array(
      z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"] as const)
    ),
  }),
});

export async function assignUserRoles(
  req: AuthenticatedRequest,
  res: Response
) {
  const targetId = req.params.id;
  const roles = req.body.roles as AppRole[];
  const updated = await assignRoles(Number(req.user!.id), Number(targetId), roles);
  res.json({ user: updated });
}

// Get all users (superadmin only)
export const listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const users = await getAllUsers();
  return ApiResponse.ok(res, users);
});

// Get user by ID (superadmin only)
export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await getUserById(Number(req.params.id));
  return ApiResponse.ok(res, user);
});

// Create user (superadmin only)
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    roles: z.array(
      z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"] as const)
    ),
  }),
});

export const createUserHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await createUser(Number(req.user!.id), req.body);
  return ApiResponse.ok(res, user, "User created successfully", 201);
});

// Update user (superadmin only)
export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    email: z.string().email().optional(),
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
      .optional(),
    roles: z.array(
      z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"] as const)
    ).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await updateUser(Number(req.user!.id), Number(req.params.id), req.body);
  return ApiResponse.ok(res, user, "User updated successfully");
});

// Delete user (superadmin only)
export const deleteUserHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await deleteUser(Number(req.user!.id), Number(req.params.id));
  return ApiResponse.ok(res, null, "User deleted successfully");
});
