import prisma from "@/config/db.js";
import { hashPassword, verifyPassword } from "@/lib/password.js";
import { issueAccessToken, issueRefreshToken } from "./tokens/token.service.js";
import { type AppRole } from "@/config/constants.js";
import ApiError from "@/core/http/ApiError.js";
import { logger } from "@/config/logger.js";

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

  if (existing) {
    throw new ApiError({
      statusCode: 400,
      message: "Email already registered",
      code: "EMAIL_ALREADY_EXISTS",
    });
  }

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
    logger.info({ event: "login_failed", email, reason: user ? "inactive" : "not_found" });
    throw new ApiError({
      statusCode: 401,
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new ApiError({
      statusCode: 401,
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
  }

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

// Change admin user password
export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError({
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  if (!user.isActive) {
    throw new ApiError({
      statusCode: 400,
      code: "USER_INACTIVE",
      message: "User account is inactive",
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_CURRENT_PASSWORD",
      message: "Current password is incorrect",
    });
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  logger.info("Admin user password changed successfully", {
    userId,
    userEmail: user.email,
  });

  return { success: true };
}
