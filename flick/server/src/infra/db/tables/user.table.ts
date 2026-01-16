import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { AuthTypeEnum } from "@/infra/db/enums";
import { colleges } from "./college.table";

export const RoleEnum = pgEnum("role", ["user", "admin", "superadmin"]);

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password"),
  authType: AuthTypeEnum("authType").notNull().default("manual"),
  refreshToken: text("refreshToken"),
  roles: RoleEnum("roles").array().notNull().default(["user"]),
  collegeId: uuid("collegeId").references(() => colleges.id),
  branch: uuid("branch").references(() => colleges.id),
  karma: integer("karma").default(0),

  isBlocked: boolean("isBlocked").notNull().default(false),
  suspension: jsonb("suspension").notNull().default({
    reason: null,
    ends: null,
    howManyTimes: 0,
  }).$type<{ reason: string | null; ends: Date | null, howManyTimes: number }>(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
