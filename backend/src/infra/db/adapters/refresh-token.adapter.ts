import { and, eq } from "drizzle-orm";
import db from "..";
import { RefreshTokenTable } from "../tables/refresh-token.table";
import { DB } from "../types";

export const revokeAllRefreshTokens = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  await client
    .update(RefreshTokenTable)
    .set({ refreshToken: null })
    .where(eq(RefreshTokenTable.userId, userId));
};

export const revokeRefreshToken = async (
  jti: string,
  newJti: string,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  await client
    .update(RefreshTokenTable)
    .set({ jti: newJti })
    .where(eq(RefreshTokenTable.jti, jti));
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  await client
    .update(RefreshTokenTable)
    .set({ refreshToken })
    .where(eq(RefreshTokenTable.userId, userId));
};

export const findRefreshToken = async (id: string, jti: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.refreshTokens.findFirst({
    where: and(
      eq(RefreshTokenTable.userId, id),
      eq(RefreshTokenTable.jti, jti)
    ),
  });

  return user;
};
