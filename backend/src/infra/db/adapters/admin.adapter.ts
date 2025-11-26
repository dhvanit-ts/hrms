import { eq } from "drizzle-orm";
import db from "..";
import { UserTable } from "../tables/user.table";

export const createAdmin = async ({
  email,
  username,
  password,
}: {
  email: string;
  username: string;
  password: string;
}) => {
  const admin = await db
    .insert(UserTable)
    .values([
      { email, username, roles: ["admin"], authType: "manual", password },
    ])
    .returning();
  return admin[0];
};

export const getAdmin = async (adminId: string) => {
  const admin = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, adminId));
  return admin[0];
};

export const listAdmins = async () => {
  const admins = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.roles, ["admin"]));
  return admins;
};

export const promoteToAdmin = async (adminId: string) => {
  const admin = await db
    .update(UserTable)
    .set({ roles: ["admin"] })
    .where(eq(UserTable.id, adminId))
    .returning();
  return admin[0];
};

export const demoteFromAdmin = async (adminId: string) => {
  const admin = await db
    .update(UserTable)
    .set({ roles: [] })
    .where(eq(UserTable.id, adminId))
    .returning();
  return admin[0];
};
