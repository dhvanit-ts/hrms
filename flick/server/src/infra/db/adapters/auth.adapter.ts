import type { UserSelect, UserInsert } from "@/shared/types/User";
import { eq, or, sql } from "drizzle-orm";
import db from "@/infra/db/index";
import { users } from "@/infra/db/tables/user.table";
import type { DB } from "@/infra/db/types";

export const findById = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user;
};

export const updateRefreshToken = async (
  id: string,
  refreshToken: string,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  await client
    .update(users)
    .set({ refreshToken })
    .where(eq(users.id, id))
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  return user;
};

export const create = async (user: UserInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdUser = await client
    .insert(users)
    .values(user)
    .returning()
    .then((r) => r?.[0] || null);

  return createdUser;
};

export const updateKarma = async (karmaChange: number, ownerId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const [updatedUser] = await client
    .update(users)
    .set({
      karma: sql`${users.karma} + ${karmaChange}`,
    })
    .where(eq(users.id, ownerId))
    .returning({ karma: users.karma });

  return updatedUser;
};

export const update = async (userId: string, updates: Partial<UserInsert>, dbTx?: DB) => {
  const client = dbTx ?? db;
  const [updatedUser] = await client
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
};

export const findByUsername = async (username: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(users.username, username),
  });

  return user;
};

export const searchUsers = async (query: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const results = await client.query.users.findMany({
    where: or(
      sql`LOWER(${users.username}) LIKE LOWER(${`%${query}%`})`,
      sql`LOWER(${users.email}) LIKE LOWER(${`%${query}%`})`
    ),
    columns: {
      id: true,
      username: true,
      email: true,
    },
  });

  return results;
};
