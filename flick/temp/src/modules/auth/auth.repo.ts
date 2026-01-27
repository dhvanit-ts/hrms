import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { DB } from "@/infra/db/types";
import { withCache } from "@/lib/cached";
import { UserCacheKeys } from "./auth.cache-keys";

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
    create: authAdapter.create,
    updateRefreshToken: authAdapter.updateRefreshToken
  }
}

export default AuthRepo
