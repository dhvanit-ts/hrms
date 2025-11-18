import prisma from "@/config/db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { issueAccessToken, issueRefreshToken } from "./tokenService.js";
import { type AppRole } from "../config/constants.js";

export interface AuthResult {
  user: Omit<any, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(
  email: string,
  password: string,
  roles: AppRole[] = ["EMPLOYEE"]
) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(password);

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      roles,
      lastLogin: new Date(),
    },
  });

  const accessToken = issueAccessToken({
    sub: created.id.toString(),
    email: created.email,
    roles: created.roles as string[],
  });

  const { token: refreshToken } = await issueRefreshToken(created.id);

  return {
    user: { ...created, passwordHash: undefined },
    accessToken,
    refreshToken,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  const accessToken = issueAccessToken({
    sub: user.id.toString(),
    email: user.email,
    roles: user.roles as string[],
  });

  const { token: refreshToken } = await issueRefreshToken(user.id);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return {
    user: { ...updated, passwordHash: undefined },
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(userId: number) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokens: {
        deleteMany: {},
      },
    },
  });
}