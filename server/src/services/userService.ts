import { Types } from 'mongoose';
import { User } from '../models/User.js';
import type { AppRole } from '../config/constants.js';

export async function getUserById(id: string) {
  return User.findById(new Types.ObjectId(id)).lean();
}

export async function updateOwnProfile(userId: string, data: Partial<{ email: string }>) {
  if (data.email) {
    data.email = data.email.toLowerCase().trim();
  }
  await User.updateOne({ _id: userId }, { $set: data }).exec();
  return getUserById(userId);
}

export async function assignRoles(actingUserId: string, targetUserId: string, roles: AppRole[]) {
  const actor = await User.findById(actingUserId).lean();
  const target = await User.findById(targetUserId).lean();
  if (!actor || !target) throw new Error('User not found');
  const actorIsSuper = actor.roles.includes('SUPER_ADMIN' as AppRole);
  if (roles.includes('SUPER_ADMIN' as AppRole) && !actorIsSuper) {
    throw new Error('Insufficient role to grant SUPER_ADMIN');
  }
  await User.updateOne({ _id: targetUserId }, { $set: { roles } }).exec();
  return getUserById(targetUserId);
}


