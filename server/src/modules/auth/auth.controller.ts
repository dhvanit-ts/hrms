import type { Request, Response } from "express";
import { z } from "zod";
import { loadEnv } from "@/config/env";
import { loginUser, registerUser, logoutUser, changeUserPassword } from "./auth.service.js";
import {
  buildRefreshCookie,
  rotateRefreshToken,
  issueAccessToken,
} from "@/modules/auth/tokens/token.service";
import jwt from "jsonwebtoken";
import prisma from "@/config/db.js";
import asyncHandler from "@/core/http/asyncHandler.js";
import ApiError from "@/core/http/ApiError.js";
import { debug, logger } from "@/config/logger.js";
import { authenticate } from "@/core/middlewares/auth.js";

export const registerSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    roles: z
      .array(z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"]))
      .optional(),
  }),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const { email, password, roles } = req.body;
  const result = await registerUser(email, password, roles);
  const refreshCookie = buildRefreshCookie(
    result.refreshToken,
    7 * 24 * 60 * 60 * 1000,
    env.COOKIE_DOMAIN,
    env.COOKIE_SECURE,
    env.COOKIE_SAMESITE as any
  );
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .status(201)
    .json({ user: result.user, accessToken: result.accessToken });
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  const refreshCookie = buildRefreshCookie(
    result.refreshToken,
    7 * 24 * 60 * 60 * 1000,
    env.COOKIE_DOMAIN,
    env.COOKIE_SECURE,
    env.COOKIE_SAMESITE as any
  );
  debug.log('Admin login - Setting refresh cookie:', refreshCookie.name, 'with options:', refreshCookie.options);
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .json({ user: result.user, accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      if (payload?.sub) {
        const userId = typeof payload.sub === "string" ? parseInt(payload.sub, 10) : payload.sub;
        if (Number.isInteger(userId)) await logoutUser(userId);
      }
    } catch (err) {
      logger.warn("Invalid access token in logout", { err: err.message });
    }
  }
  const clearOptions: any = { path: "/" };
  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== "") {
    clearOptions.domain = env.COOKIE_DOMAIN;
  }
  res.clearCookie("refresh_token", clearOptions);
  res.status(204).send();
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const env = loadEnv();
  debug.log('Admin refresh - All cookies received:', req.cookies);
  const cookie = req.cookies?.refresh_token as string | undefined;
  if (!cookie) {
    debug.log('Admin refresh - No refresh_token cookie found');
    throw new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      code: "MISSING_REFRESH_TOKEN",
    });
  }
  debug.log('Admin refresh - Found refresh_token cookie');

  const { userId, newToken } = await rotateRefreshToken(cookie);
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      code: "USER_NOT_FOUND",
    });
  }
  const accessToken = issueAccessToken({
    sub: userId.toString(),
    email: user.email,
    roles: user.roles as string[],
  });
  const refreshCookie = buildRefreshCookie(
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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  }),
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = parseInt((req as any).user.id); // From authenticate middleware

  await changeUserPassword(userId, currentPassword, newPassword);

  res.json({ message: "Password changed successfully" });
});
