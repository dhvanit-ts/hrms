import prisma from "@/config/db.js";
import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import { createJti } from '../utils/crypto.js';

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
  sub: string;
  jti: string;
}

export function issueAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"]
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

export function buildRefreshCookie(token: string, maxAgeMs: number, domain?: string, secure?: boolean, sameSite: 'lax' | 'strict' | 'none' = 'lax') {
  return {
    name: 'refresh_token',
    value: token,
    options: {
      httpOnly: true,
      secure: !!secure,
      sameSite,
      domain,
      path: '/api/auth/refresh',
      maxAge: maxAgeMs
    }
  } as const;
}

export async function rotateRefreshToken(oldToken: string) {
  
  const payload = jwt.verify(oldToken, env.JWT_REFRESH_SECRET) as JwtUserPayload;

  const userId = payload.sub;
  const oldJti = payload.jti;

  const existing = await prisma.refreshToken.findUnique({
    where: { jti: oldJti },
  });

  // Token reuse or not found
  if (!existing || existing.revokedAt) {
    await prisma.refreshToken.deleteMany({
      where: { userId: parseInt(userId) },
    });
    throw new Error("Refresh token reuse detected");
  }

  // Mark old token as revoked
  await prisma.refreshToken.update({
    where: { jti: oldJti },
    data: { revokedAt: new Date() },
  });

  // Issue new one
  const { token: newToken, jti: newJti } = await issueRefreshToken(parseInt(userId));

  return { userId, newToken, newJti };
}
