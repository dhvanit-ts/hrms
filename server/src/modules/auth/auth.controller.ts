import type { Request, Response } from "express";
import { z } from "zod";
import { loadEnv } from "@/config/env";
import { loginUser, registerUser, logoutUser } from "./auth.service.js";
import {
  buildRefreshCookie,
  rotateRefreshToken,
  issueAccessToken,
} from "@/modules/auth/tokens/token.service";
import jwt from "jsonwebtoken";

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    roles: z
      .array(z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"]))
      .optional(),
  }),
});

export async function register(req: Request, res: Response) {
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
}

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
});

export async function login(req: Request, res: Response) {
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
  res
    .cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    .json({ user: result.user, accessToken: result.accessToken });
}

export async function logout(req: Request, res: Response) {
  const env = loadEnv();
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const token = auth.slice(7);
      const payload = jwt.decode(token) as any;
      if (payload?.sub) {
        await logoutUser(payload.sub);
      }
    } catch {}
  }
  res.clearCookie("refresh_token", {
    path: "/api/auth/refresh",
    domain: env.COOKIE_DOMAIN,
  });
  res.status(204).send();
}

export async function refresh(req: Request, res: Response) {
  const env = loadEnv();
  const cookie = req.cookies?.refresh_token as string | undefined;
  if (!cookie) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId, newToken } = await rotateRefreshToken(cookie);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const accessToken = issueAccessToken({
      sub: userId,
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
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
