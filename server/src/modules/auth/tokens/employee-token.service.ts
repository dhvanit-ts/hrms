import prisma from "@/config/db.js";
import jwt from "jsonwebtoken";
import { loadEnv } from "@/config/env.js";
import { createJti } from "@/lib/crypto.js";
import ApiError from "@/core/http/ApiError.js";

const env = loadEnv();

export interface JwtEmployeePayload {
  sub: string;
  employeeId: string;
  email: string;
  departmentId: number | null;
  jobRoleId: number | null;
  jti?: string;
}

interface EmployeeRefreshPayload {
  sub: string;
  jti: string;
}

export function issueEmployeeAccessToken(payload: JwtEmployeePayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export async function issueEmployeeRefreshToken(employeeId: number) {
  const jti = createJti();
  const expiresIn = env.REFRESH_TTL as jwt.SignOptions["expiresIn"];

  const token = jwt.sign({ sub: employeeId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn,
  });

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.employeeRefreshToken.create({
    data: {
      jti,
      expiresAt,
      employeeId,
    },
  });

  return { token, jti, expiresAt };
}

export function buildEmployeeRefreshCookie(
  token: string,
  maxAgeMs: number,
  domain?: string,
  secure?: boolean,
  sameSite: "lax" | "strict" | "none" = "lax"
) {
  const options: any = {
    httpOnly: true,
    secure: !!secure,
    sameSite,
    path: "/",
    maxAge: maxAgeMs,
  };

  // Only set domain if it's explicitly provided and not empty
  if (domain && domain.trim() !== "") {
    options.domain = domain;
  }

  return {
    name: "employee_refresh_token",
    value: token,
    options,
  } as const;
}

export async function rotateEmployeeRefreshToken(oldToken: string) {
  const payload = jwt.verify(
    oldToken,
    env.JWT_REFRESH_SECRET
  ) as EmployeeRefreshPayload;

  const employeeId = payload.sub;
  const oldJti = payload.jti;

  const existing = await prisma.employeeRefreshToken.findUnique({
    where: { jti: oldJti },
  });

  // Token reuse or not found
  if (!existing || existing.revokedAt) {
    await prisma.employeeRefreshToken.deleteMany({
      where: { employeeId: parseInt(employeeId) },
    });
    throw new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      code: "TOKEN_REUSE_DETECTED",
    });
  }

  // Mark old token as revoked
  await prisma.employeeRefreshToken.update({
    where: { jti: oldJti },
    data: { revokedAt: new Date() },
  });

  // Issue new one
  const { token: newToken, jti: newJti } = await issueEmployeeRefreshToken(
    parseInt(employeeId)
  );

  return { employeeId, newToken, newJti };
}
