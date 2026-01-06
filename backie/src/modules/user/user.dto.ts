import { User } from "@/shared/types/User";

// what the client is allowed to see
export const toPublicUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  roles: user.roles,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// what internal services / server can see
export const toInternalUser = (user: User) => ({
  ...toPublicUser(user),
  authType: user.authType,
});

export type PublicUser = ReturnType<typeof toPublicUser>;
export type InternalUser = ReturnType<typeof toInternalUser>;
