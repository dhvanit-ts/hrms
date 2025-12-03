import prisma from "@/config/db.js";
import jwt from "jsonwebtoken";
import { loadEnv } from "@/config/env.js";
import { createJti } from "@/lib/crypto.js";
import ApiError from "@/core/http/ApiError.js";

const env = loadEnv();
const secret = env.JWT_ACCESS_SECRET;
if (!secret) throw new Error("JWT_ACCESS_SECRET not defined!");

export interface JwtUserPayload {
  sub: string;
  email: string;
  roles: string[];
  jti?: string;
}

interface RefreshPayload {
  sub: string | number;
  jti: string;
}

export function issueAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export async function issueRefreshToken(userId: number) {
  const jti = createJti();
  const expiresIn = env.REFRESH_TTL as jwt.SignOptions["expiresIn"];

  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn,
  });

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      jti,
      expiresAt,
      userId,
    },
  });

  return { token, jti, expiresAt };
}

export function buildRefreshCookie(
  token: string,
  maxAgeMs: number,
  domain?: string,
  secure?: boolean,
  sameSite: "lax" | "strict" | "none" = "lax"
) {
  return {
    name: "refresh_token",
    value: token,
    options: {
      httpOnly: true,
      secure: !!secure,
      sameSite,
      domain,
      path: "/api/auth/refresh",
      maxAge: maxAgeMs,
    },
  } as const;
}

export async function rotateRefreshToken(oldToken: string) {
  const payload = jwt.verify(
    oldToken,
    env.JWT_REFRESH_SECRET
  ) as RefreshPayload;

  const userId = typeof payload.sub === "string" ? parseInt(payload.sub) : payload.sub;
  const oldJti = payload.jti;

  // atomic revoke: update and ensure revokedAt was null
  const updated = await prisma.refreshToken.updateMany({
    where: { jti: oldJti, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (updated.count === 0) {
    // either not found or already revoked (reuse)
    await prisma.refreshToken.deleteMany({ where: { userId } });
    throw new ApiError({ statusCode: 401, message: "Unauthorized", code: "TOKEN_REUSE_DETECTED" });
  }

  // now safely issue new token
  const { token: newToken, jti: newJti } = await issueRefreshToken(userId);

  return { userId, newToken, newJti };
}
