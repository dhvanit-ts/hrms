import { and, eq, or, sql } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { users, colleges } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.id, id),
  });

  return user;
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.email, email),
  });

  return user;
};

export const findByUsername = async (username: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.username, username),
  });

  return user;
};

export const findByQuery = async (
  filters: {
    email?: string;
    username?: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;

  let whereConditions = [];

  if (filters.email) {
    whereConditions.push(eq(users.email, filters.email));
  }

  if (filters.username) {
    whereConditions.push(eq(users.username, filters.username));
  }

  if (whereConditions.length === 0) {
    return [];
  }

  const results = await client
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      roles: users.roles,
      isBlocked: users.isBlocked,
      suspension: users.suspension,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeProfile: colleges.profile,
    })
    .from(users)
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(or(...whereConditions));

  return results.map(row => ({
    _id: row.id,
    username: row.username,
    email: row.email,
    roles: row.roles,
    isBlocked: row.isBlocked,
    suspension: row.suspension,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    college: row.collegeId ? {
      _id: row.collegeId,
      name: row.collegeName,
      profile: row.collegeProfile,
    } : null,
  }));
};

export const updateById = async (
  id: string,
  updates: Partial<typeof users.$inferInsert>,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const updatedUser = await client
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedUser;
};

export const blockUser = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const updatedUser = await client
    .update(users)
    .set({ isBlocked: true, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedUser;
};

export const unblockUser = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const updatedUser = await client
    .update(users)
    .set({ isBlocked: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedUser;
};

export const suspendUser = async (
  id: string,
  suspensionData: {
    ends: Date;
    reason: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;

  // First get current suspension data to increment count
  const currentUser = await findById(id, dbTx);
  if (!currentUser) return null;

  const currentSuspension = currentUser.suspension as { howManyTimes: number } | null;
  const howManyTimes = (currentSuspension?.howManyTimes || 0) + 1;

  const updatedUser = await client
    .update(users)
    .set({
      suspension: {
        ends: suspensionData.ends,
        reason: suspensionData.reason,
        howManyTimes,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedUser;
};

export const getSuspensionStatus = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client
    .select({
      id: users.id,
      suspension: users.suspension,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user[0] || null;
};