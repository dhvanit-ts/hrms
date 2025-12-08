import prisma from "@/config/db.js";
import type { AppRole } from "@/config/constants.js";
import ApiError from "@/core/http/ApiError.js";
import { hashPassword } from "@/lib/password.js";

// Get user by ID
export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      roles: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

// Get all users (superadmin only)
export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      roles: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Create user (superadmin only)
export async function createUser(
  actingUserId: number,
  data: {
    email: string;
    password: string;
    roles: AppRole[];
  }
) {
  const actor = await getUserById(actingUserId);
  if (!actor) {
    throw new ApiError({
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "Acting user not found",
    });
  }

  const actorRoles = actor.roles as string[];
  const actorIsSuper = actorRoles.includes("SUPER_ADMIN");

  if (!actorIsSuper) {
    throw new ApiError({
      statusCode: 403,
      code: "INSUFFICIENT_PERMISSIONS",
      message: "Only SUPER_ADMIN can create users",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new ApiError({
      statusCode: 409,
      code: "USER_EXISTS",
      message: "User with this email already exists",
    });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      roles: data.roles,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      roles: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// Update user (superadmin only)
export async function updateUser(
  actingUserId: number,
  targetUserId: number,
  data: Partial<{
    email: string;
    password: string;
    roles: AppRole[];
    isActive: boolean;
  }>
) {
  const actor = await getUserById(actingUserId);
  const target = await getUserById(targetUserId);

  if (!actor || !target) {
    throw new ApiError({
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  const actorRoles = actor.roles as string[];
  const actorIsSuper = actorRoles.includes("SUPER_ADMIN");

  if (!actorIsSuper) {
    throw new ApiError({
      statusCode: 403,
      code: "INSUFFICIENT_PERMISSIONS",
      message: "Only SUPER_ADMIN can update users",
    });
  }

  // Prevent superadmin from deactivating themselves
  if (actingUserId === targetUserId && data.isActive === false) {
    throw new ApiError({
      statusCode: 400,
      code: "CANNOT_DEACTIVATE_SELF",
      message: "Cannot deactivate your own account",
    });
  }

  const updateData: any = {};
  if (data.email) updateData.email = data.email.toLowerCase().trim();
  if (data.password) updateData.passwordHash = await hashPassword(data.password);
  if (data.roles) updateData.roles = data.roles;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await prisma.user.update({
    where: { id: targetUserId },
    data: updateData,
  });

  return getUserById(targetUserId);
}

// Delete user (superadmin only)
export async function deleteUser(actingUserId: number, targetUserId: number) {
  const actor = await getUserById(actingUserId);
  const target = await getUserById(targetUserId);

  if (!actor || !target) {
    throw new ApiError({
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  const actorRoles = actor.roles as string[];
  const actorIsSuper = actorRoles.includes("SUPER_ADMIN");

  if (!actorIsSuper) {
    throw new ApiError({
      statusCode: 403,
      code: "INSUFFICIENT_PERMISSIONS",
      message: "Only SUPER_ADMIN can delete users",
    });
  }

  // Prevent superadmin from deleting themselves
  if (actingUserId === targetUserId) {
    throw new ApiError({
      statusCode: 400,
      code: "CANNOT_DELETE_SELF",
      message: "Cannot delete your own account",
    });
  }

  await prisma.user.delete({
    where: { id: targetUserId },
  });
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

  if (!actor || !target) {
    throw new ApiError({
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  const parsedRoles = actor.roles as string[];
  const actorIsSuper = parsedRoles.includes("SUPER_ADMIN");
  if (roles.includes("SUPER_ADMIN" as AppRole) && !actorIsSuper) {
    throw new ApiError({
      statusCode: 403,
      code: "INSUFFICIENT_PERMISSIONS",
      message: "Insufficient role to grant SUPER_ADMIN",
    });
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { roles },
  });

  return getUserById(targetUserId);
}
