import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { AuthTypeEnum, RoleEnum } from "@/infa/db/core/enums";

export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password"),
  authType: AuthTypeEnum("authType").notNull().default("manual"),
  refreshToken: text("refreshToken"),
  roles: RoleEnum("roles").array().notNull().default(["user"]),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
