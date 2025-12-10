import type { Request, Response } from "express";
import { z } from "zod";
import { loadEnv } from "@/config/env";
import { loginEmployee, logoutEmployee, setupEmployeePassword } from "./employee-auth.service.js";
import {
  buildEmployeeRefreshCookie,
  rotateEmployeeRefreshToken,
  issueEmployeeAccessToken,
} from "./tokens/employee-token.service.js";
import jwt from "jsonwebtoken";
import prisma from "@/config/db.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import ApiError from "@/core/http/ApiError.js";

export const employeeSetupPasswordSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  }),
});

export const setupPassword = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const { employeeId, password } = req.body;
  const result = await setupEmployeePassword(employeeId, password);
  const refreshCookie = buildEmployeeRefreshCookie(
    result.refreshToken,
    7 * 24 * 60 * 60 * 1000,
    env.COOKIE_DOMAIN,
    env.COOKIE_SECURE,
    env.COOKIE_SAMESITE as any
  );
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .status(201)
    .json({ employee: result.employee, accessToken: result.accessToken });
});

export const employeeLoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Employee ID or email is required"),
    password: z.string().min(8, "Password is required"),
  }),
});

export const employeeLogin = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const { identifier, password } = req.body;
  const result = await loginEmployee(identifier, password);
  const refreshCookie = buildEmployeeRefreshCookie(
    result.refreshToken,
    7 * 24 * 60 * 60 * 1000,
    env.COOKIE_DOMAIN,
    env.COOKIE_SECURE,
    env.COOKIE_SAMESITE as any
  );
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .json({ employee: result.employee, accessToken: result.accessToken });
});

export const employeeLogout = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const token = auth.slice(7);
      const payload = jwt.decode(token) as any;
      if (payload?.sub) {
        await logoutEmployee(parseInt(payload.sub));
      }
    } catch { }
  }
  const clearOptions: any = { path: "/" };
  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== "") {
    clearOptions.domain = env.COOKIE_DOMAIN;
  }
  res.clearCookie("employee_refresh_token", clearOptions);
  res.status(204).send();
});

export const employeeRefreshSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const employeeRefresh = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const cookie = req.cookies?.employee_refresh_token as string | undefined;
  if (!cookie) {
    throw new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      code: "MISSING_REFRESH_TOKEN",
    });
  }

  const { employeeId, newToken } = await rotateEmployeeRefreshToken(cookie);
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(employeeId) },
  });
  if (!employee) {
    throw new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      code: "EMPLOYEE_NOT_FOUND",
    });
  }
  const accessToken = issueEmployeeAccessToken({
    sub: employeeId,
    employeeId: employee.employeeId,
    email: employee.email,
    departmentId: employee.departmentId,
    jobRoleId: employee.jobRoleId,
  });
  const refreshCookie = buildEmployeeRefreshCookie(
    newToken,
    7 * 24 * 60 * 60 * 1000,
    env.COOKIE_DOMAIN,
    env.COOKIE_SECURE,
    env.COOKIE_SAMESITE as any
  );
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .json({ accessToken });
});
