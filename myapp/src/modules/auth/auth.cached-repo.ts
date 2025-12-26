import * as repo from "./auth.repo";
import { withCache } from "@/lib/cached";
import { UserCacheKeys } from "./auth.cache-keys";
import { DB } from "@/infra/db/types";

export const findById = (id: string, dbTx?: DB) =>
  withCache(UserCacheKeys.id(id), () => repo.findById(id, dbTx));

export const findByEmail = (email: string, dbTx?: DB) =>
  withCache(UserCacheKeys.email(email), () => repo.findByEmail(email, dbTx));

export const findByUsername = (username: string, dbTx?: DB) =>
  withCache(UserCacheKeys.username(username), () =>
    repo.findByUsername(username, dbTx)
  );

export const searchUsers = (query: string, dbTx?: DB) =>
  withCache(UserCacheKeys.search(query), () =>
    repo.searchUsers(query, dbTx)
  );
