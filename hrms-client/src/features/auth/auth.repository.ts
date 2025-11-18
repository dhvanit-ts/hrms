import * as authAdapter from "@/adapters/auth.adapter";
import { IUser } from "@/common/types/IUser";


export const findById = async (userId: string) => {
  return await authAdapter.findById(userId);
}

export const updateRefreshToken = async (user: IUser, refreshToken: string) => {
  return await authAdapter.updateRefreshToken(user, refreshToken);
}

export const findByEmail = async (email: string) => {
  return await authAdapter.findByEmail(email);
}

export const create = async (user: IUser) => {
  return await authAdapter.create(user);
}

export const findByUsername = async (username: string) => {
  return await authAdapter.findByUsername(username);
}

export const searchUsers = async (query: string) => {
  return await authAdapter.searchUsers(query);
}