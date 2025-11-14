import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import { createJti } from '../utils/crypto.js';
import { User } from '../models/User.js';

export interface JwtUserPayload {
  sub: string;
  email: string;
  roles: string[];
  jti?: string;
}

const env = loadEnv();

export function issueAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL
  });
}

export async function issueRefreshToken(userId: string) {
  const jti = createJti();
  const expiresIn = env.REFRESH_TTL;
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, { expiresIn });

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await User.updateOne(
    { _id: userId },
    { $push: { refreshTokens: { jti, expiresAt } } }
  ).exec();
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
  const payload = jwt.verify(oldToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & { sub: string; jti: string; };
  const userId = payload.sub as string;
  const oldJti = payload.jti!;
  const user = await User.findById(userId).lean();
  const known = user?.refreshTokens.find((t) => t.jti === oldJti);
  if (!known || known.revokedAt) {
    await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } }).exec();
    throw new Error('Refresh token reuse detected');
  }
  await User.updateOne(
    { _id: userId, 'refreshTokens.jti': oldJti },
    { $set: { 'refreshTokens.$.revokedAt': new Date() } }
  ).exec();

  const { token: newToken, jti: newJti } = await issueRefreshToken(userId);
  return { userId, newToken, newJti };
}


