import prisma from "@/config/db.js";
import type { AppRole } from "../config/constants.js";

// Get user by ID
export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

// Update own profile
export async function updateOwnProfile(
  userId: number,
  data: Partial<{ email: string }>
) {
  if (data.email) data.email = data.email.toLowerCase().trim();

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return getUserById(userId);
}

// Assign roles
export async function assignRoles(
  actingUserId: number,
  targetUserId: number,
  roles: AppRole[]
) {
  const actor = await getUserById(actingUserId);
  const target = await getUserById(targetUserId);

  if (!actor || !target) throw new Error("User not found");

  const parsedRoles = actor.roles as string[];
  const actorIsSuper = parsedRoles.includes("SUPER_ADMIN");
  if (roles.includes("SUPER_ADMIN" as AppRole) && !actorIsSuper) {
    throw new Error("Insufficient role to grant SUPER_ADMIN");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { roles },
  });

  return getUserById(targetUserId);
}
