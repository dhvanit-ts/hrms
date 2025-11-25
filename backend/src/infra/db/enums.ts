import { pgEnum } from "drizzle-orm/pg-core";

export const AuthTypeEnum = pgEnum("authType", ["manual", "oauth"]);
export const RoleEnum = pgEnum("role", ["user", "admin", "superadmin"]);
