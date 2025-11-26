import { IUser, IUserCreate } from "@/shared/types/IUser";
import { DB } from "@/infra/db/types";
import { eq, or, sql } from "drizzle-orm";
import db from "@/infra/db";
import { UserTable } from "@/infra/db/tables/user.table";

export const findById = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(UserTable.id, userId),
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
    .update(UserTable)
    .set({ refreshToken })
    .where(eq(UserTable.id, id));
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(UserTable.email, email.toLowerCase()),
  });

  return user;
};

export const create = async (user: IUserCreate, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdUser = await client
    .insert(UserTable)
    .values(user)
    .returning()
    .then((r) => r?.[0] ?? null);

  return createdUser;
};

export const findByUsername = async (username: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.users.findFirst({
    where: eq(UserTable.username, username),
  });

  return user;
};

export const searchUsers = async (query: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const users = await client.query.users.findMany({
    where: or(
      sql`LOWER(${UserTable.username}) LIKE LOWER(${`%${query}%`})`,
      sql`LOWER(${UserTable.email}) LIKE LOWER(${`%${query}%`})`
    ),
    columns: {
      id: true,
      username: true,
      email: true,
    },
  });

  return users;
};
