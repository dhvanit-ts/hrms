import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { cached } from "@/lib/cached";
import { DB } from "@/infra/db/types";
import authCacheKeys from "./auth.cache-keys";

const AuthRepo = {
  Read: {
    findById: (userId: string, dbTx?: DB) => authAdapter.findById(userId, dbTx),

    findByEmail: (email: string, dbTx?: DB) => authAdapter.findByEmail(email, dbTx),

    findByUsername: (username: string, dbTx?: DB) => authAdapter.findByUsername(username, dbTx),

    searchUsers: (query: string, dbTx?: DB) => authAdapter.searchUsers(query, dbTx)
  },

  CachedRead: {
    findById: (userId: string, dbTx?: DB) =>
      cached(authCacheKeys.id(userId), () => authAdapter.findById(userId, dbTx)),

    findByEmail: (email: string, dbTx?: DB) =>
      cached(authCacheKeys.email(email), () => authAdapter.findByEmail(email, dbTx)),

    findByUsername: (username: string, dbTx?: DB) =>
      cached(authCacheKeys.username(username), () =>
        authAdapter.findByUsername(username, dbTx)
      ),
    searchUsers: (query: string, dbTx?: DB) =>
      cached(authCacheKeys.search(query), () => authAdapter.searchUsers(query, dbTx))
  },

  Write: {
    updateRefreshToken: authAdapter.updateRefreshToken,
    create: authAdapter.create,
    update: authAdapter.update
  }
}

export default AuthRepo