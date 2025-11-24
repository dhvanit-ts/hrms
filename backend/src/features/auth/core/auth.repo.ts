import * as authAdapter from "@/adapters/auth.adapter";
import { IUser } from "@/common/types/IUser";
import logger from "@/common/utils/logger";
import { cached } from "@/utils/cached";

import { DB } from "@/common/config/db/types"

const keys = {
  id: (id: string) => `user:id:${id}`,
  email: (email: string) => `user:email:${email}`,
  username: (u: string) => `user:username:${u}`,
  search: (q: string) => `user:search:${q}`,
};

export const findById = (userId: string, dbTx?: DB) =>
  cached(keys.id(userId), () => authAdapter.findById(userId, dbTx));

export const findByEmail = (email: string, dbTx?: DB) =>
  cached(keys.email(email), () => authAdapter.findByEmail(email, dbTx));

export const findByUsername = (
  username: string, 
  dbTx?: DB
) =>
  cached(keys.username(username), () => 
    authAdapter.findByUsername(username, dbTx)
  );

export const searchUsers = (query: string, dbTx?: DB) =>
  cached(keys.search(query), () => authAdapter.searchUsers(query, dbTx));

export const updateRefreshToken = async (
  id: string, 
  refreshToken: string, 
  dbTx?: DB
) => {
  logger.info(`Updating refresh token for user ${id}`);
  return authAdapter.updateRefreshToken(id, refreshToken, dbTx);
};

export const create = async (user: IUser, dbTx?: DB) => {
  logger.info(`Creating new user ${user.email}`);
  return authAdapter.create(user, dbTx);
};
