import * as authAdapter from "@/infra/db/adapters/auth.adapter";
import { DB } from "@/infra/db/types";

export const findById = (id: string, dbTx?: DB) =>
  authAdapter.findById(id, dbTx);

export const findByEmail = (email: string, dbTx?: DB) =>
  authAdapter.findByEmail(email, dbTx);

export const findByUsername = (username: string, dbTx?: DB) =>
  authAdapter.findByUsername(username, dbTx);

export const searchUsers = (query: string, dbTx?: DB) =>
  authAdapter.searchUsers(query, dbTx);

export const create = authAdapter.create;
export const updateRefreshToken = authAdapter.updateRefreshToken;
