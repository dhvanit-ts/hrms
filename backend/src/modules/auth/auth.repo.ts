import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { User } from "@/shared/types/User";
import logger from "@/core/logger";
import { withCache } from "@/lib/cached";
import { DB } from "@/infra/db/types";

// TODO: Cache invalidation is missing
// That means, when you update some field, user will get old cached value
// cached.invalidate(keys.id(id));
// cached.invalidate(keys.email(email));
// cached.invalidate(keys.username(username));

// You'll invalidate (delete) cached stuff by key in the service itself

const keys = {
  id: (id: string) => `user:id:${id}`,
  email: (email: string) => `user:email:${email}`,
  username: (u: string) => `user:username:${u}`,
  search: (q: string, page: number = 0, limit: number = 0) =>
    `user:search:${q.trim().toLowerCase()}:${page}:${limit}`,
};

export const UserCacheKeys = keys

export const findById = (userId: string, dbTx?: DB) =>
  withCache(keys.id(userId), () => authAdapter.findById(userId, dbTx));

export const findByEmail = (email: string, dbTx?: DB) =>
  withCache(keys.email(email), () => authAdapter.findByEmail(email, dbTx));

export const findByUsername = (username: string, dbTx?: DB) =>
  withCache(keys.username(username), () =>
    authAdapter.findByUsername(username, dbTx)
  );

export const searchUsers = (query: string, dbTx?: DB) =>
  withCache(keys.search(query), () => authAdapter.searchUsers(query, dbTx));

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
