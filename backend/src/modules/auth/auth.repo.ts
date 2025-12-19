import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { User } from "@/shared/types/User";
import logger from "@/core/logger";
import { withCache } from "@/lib/cached";
import { DB } from "@/infra/db/types";
import { UserCacheKeys } from "./auth.cache";

export const findById = (userId: string, dbTx?: DB) =>
  withCache(UserCacheKeys.id(userId), () => authAdapter.findById(userId, dbTx));

export const findByIdForAuth = (userId: string, dbTx?: DB) => authAdapter.findById(userId, dbTx);

export const findByEmail = (email: string, dbTx?: DB) =>
  withCache(UserCacheKeys.email(email), () => authAdapter.findByEmail(email, dbTx));

export const findByUsername = (username: string, dbTx?: DB) =>
  withCache(UserCacheKeys.username(username), () =>
    authAdapter.findByUsername(username, dbTx)
  );

export const searchUsers = (query: string, dbTx?: DB) =>
  withCache(UserCacheKeys.search(query), () => authAdapter.searchUsers(query, dbTx));

export const updateRefreshToken = async (
  id: string,
  refreshToken: string,
  dbTx?: DB
) => {
  logger.debug(`Updating refresh token for user ${id}`);
  return authAdapter.updateRefreshToken(id, refreshToken, dbTx);
};

export const create = async (user: User, dbTx?: DB) => {
  logger.debug(`Creating new user ${user.email}`);
  return authAdapter.create(user, dbTx);
};
