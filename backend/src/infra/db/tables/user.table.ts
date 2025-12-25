import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { AuthTypeEnum } from "@/infra/db/enums";

export const RoleEnum = pgEnum("role", ["user", "admin", "superadmin"]);

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password"),
  authType: AuthTypeEnum("authType").notNull().default("manual"),
  refreshToken: text("refreshToken"),
  roles: RoleEnum("roles").array().default(["user"]).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
