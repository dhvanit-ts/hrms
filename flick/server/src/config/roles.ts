export const roleKeys = ["user", "admin", "superadmin"] as const;

export const roles = {
  user: ["read:profile"],
  admin: ["read:profile", "create:user", "delete:user"],
  superadmin: ["*"],
} as const satisfies Record<(typeof roleKeys)[number], readonly string[]>;

export type Role = (typeof roleKeys)[number];
export type Permission = (typeof roles)[Role][number];
