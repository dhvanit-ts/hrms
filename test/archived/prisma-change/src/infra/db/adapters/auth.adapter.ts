import type { User } from "@/shared/types/User";
import prisma from "@/infra/db";
import type { DB } from "@/infra/db/types";

export const findById = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? prisma;
  const user = await client.user.findUnique({ where: { id: userId } });

  return user;
};

export const updateRefreshToken = async (
  id: string, 
  refreshToken: string, 
  dbTx?: DB
) => {
  const client = dbTx ?? prisma;
  await client.user.update({
    where: { id },
    data: { refreshToken },
  });
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const client = dbTx ?? prisma;
  const user = await client.user.findFirst({
    where: { email: email.toLowerCase() },
  });

  return user;
};

export const create = async (user: User, dbTx?: DB) => {
  const client = dbTx ?? prisma;
  const createdUser = await client.user.create({ data: user });

  return createdUser;
};

export const findByUsername = async (username: string, dbTx?: DB) => {
  const client = dbTx ?? prisma;
  const user = await client.user.findFirst({ where: { username } });

  return user;
};

export const searchUsers = async (query: string, dbTx?: DB) => {
  const client = dbTx ?? prisma;
  const users = await client.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  return users;
};
