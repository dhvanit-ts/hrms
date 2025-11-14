import { User, type UserDoc } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { issueAccessToken, issueRefreshToken } from './tokenService.js';
import { type AppRole } from '../config/constants.js';

export interface AuthResult {
  user: Omit<UserDoc, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(email: string, password: string, roles: AppRole[] = ['EMPLOYEE']) {
  const existing = await User.findOne({ email }).exec();
  if (existing) throw new Error('Email already registered');
  const passwordHash = await hashPassword(password);
  const created = await User.create({ email, passwordHash, roles });
  const accessToken = issueAccessToken({ sub: created.id, email: created.email, roles: created.roles });
  const { token: refreshToken } = await issueRefreshToken(created.id);
  await User.updateOne({ _id: created.id }, { $set: { lastLogin: new Date() } }).exec();
  return { user: created.toJSON() as any, accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email }).exec();
  if (!user || !user.isActive) throw new Error('Invalid credentials');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  const accessToken = issueAccessToken({ sub: user.id, email: user.email, roles: user.roles });
  const { token: refreshToken } = await issueRefreshToken(user.id);
  user.lastLogin = new Date();
  await user.save();
  return { user: user.toJSON() as any, accessToken, refreshToken };
}

export async function logoutUser(userId: string) {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } }).exec();
}


