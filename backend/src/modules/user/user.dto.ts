import { IUser } from "@/shared/types/IUser";

export const toUserSafe = (user: IUser) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  roles: user.roles,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
