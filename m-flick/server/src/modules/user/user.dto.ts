import { User } from "@/shared/types/User";

export const toUserSafe = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  roles: user.roles,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export type UserSafe = ReturnType<typeof toUserSafe>;
