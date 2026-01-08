export const roles = {
  user: ["read:profile"],
  admin: ["read:profile", "create:user", "delete:user"],
  superadmin: ["*"],
} as const;

export type Role = keyof typeof roles;
export type Permission = (typeof roles)[keyof typeof roles][number] | "*";