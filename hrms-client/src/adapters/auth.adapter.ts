import { IUser } from "@/common/types/IUser";
import prisma from "@/common/config/db";

export const findById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  return user;
}

export const updateRefreshToken = async (user: IUser, refreshToken: string) => {
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
}

export const findByEmail = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
  });

  return user;
}

export const create = async (user: IUser) => {
  const createdUser = await prisma.user.create({ data: user });

  return createdUser;
}

export const findByUsername = async (username: string) => {
  const user = await prisma.user.findFirst({
    where: { username },
  });

  return user;
}

export const searchUsers = async (query: string) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  return users;
}