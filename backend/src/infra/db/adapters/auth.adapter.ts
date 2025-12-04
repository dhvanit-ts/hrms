import type { User } from "@/shared/types/User";
import UserModel from "@/infra/db/models/user.model";
import { toObjectId } from "@/shared/utils/toObject";
import { getValidSession, type DB } from "../types";

export const findById = async (userId: string, dbTx?: DB) => {
  const session = getValidSession(dbTx);
  const user = await UserModel.findById(toObjectId(userId)).session(session);

  return user;
};

export const updateRefreshToken = async (
  id: string, 
  refreshToken: string, 
  dbTx?: DB
) => {
  const session = getValidSession(dbTx);
  await UserModel.findByIdAndUpdate(
    toObjectId(id),
    { $set: { refreshToken } },
    { new: true, runValidators: true, session }
  );
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const session = getValidSession(dbTx);
  const user = await UserModel.findOne({
    email: email.toLowerCase(),
  }).session(session);

  return user;
};

export const create = async (user: User, dbTx?: DB) => {
  const session = getValidSession(dbTx);
  const createdUser = await UserModel.create([user], { session }).then(
    (r) => r?.[0] || null,
  );

  return createdUser;
};

export const findByUsername = async (username: string, dbTx?: DB) => {
  const session = getValidSession(dbTx);
  const user = await UserModel.findOne({ username }).session(session);

  return user;
};

export const searchUsers = async (query: string, dbTx?: DB) => {
  const session = getValidSession(dbTx);
  const users = await UserModel.find(
    {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    },
    { _id: 1, username: 1, email: 1 }
  ).session(session).lean();

  return users;
};
