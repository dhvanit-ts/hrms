import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { DB } from "@/infra/db/types";
import { withCache } from "@/lib/cached";
import { UserCacheKeys } from "./auth.cache-keys";
import logger from "@/core/logger";
import { User } from "@/shared/types/User";

const AuthRepo = {
  Read: {
    findById: (id: string, dbTx?: DB) =>
      authAdapter.findById(id, dbTx),

    findByEmail: (email: string, dbTx?: DB) =>
      authAdapter.findByEmail(email, dbTx),

    findByUsername: (username: string, dbTx?: DB) =>
      authAdapter.findByUsername(username, dbTx),

    searchUsers: (query: string, dbTx?: DB) =>
      authAdapter.searchUsers(query, dbTx)
  },

  CachedRead: {
    findById: (id: string, dbTx?: DB) =>
      withCache(UserCacheKeys.id(id), () => AuthRepo.Read.findById(id, dbTx)),

    findByEmail: (email: string, dbTx?: DB) =>
      withCache(UserCacheKeys.email(email), () => AuthRepo.Read.findByEmail(email, dbTx)),

    findByUsername: (username: string, dbTx?: DB) =>
      withCache(UserCacheKeys.username(username), () =>
        AuthRepo.Read.findByUsername(username, dbTx)
      ),

    searchUsers: (query: string, dbTx?: DB) =>
      withCache(UserCacheKeys.search(query), () =>
        AuthRepo.Read.searchUsers(query, dbTx)
      )
  },

  Write: {
    create: async (user: User, dbTx?: DB) => {
      try {
        return await authAdapter.create(user, dbTx);
      } catch (err) {
        logger.error("db.user.create_failed", {
          operation: "create_user",
          reason: err instanceof Error ? err.message : "unknown",
        });
        throw err;
      }
    },
    updateRefreshToken: async (
      id: string,
      refreshToken: string,
      dbTx?: DB
    ) => {
      try {
        return await authAdapter.updateRefreshToken(id, refreshToken, dbTx);
      } catch (err) {
        logger.error("db.user.update_refresh_token_failed", {
          operation: "create_user",
          reason: err instanceof Error ? err.message : "unknown",
        });
        throw err;
      }
    }
  }
}

export default AuthRepo
