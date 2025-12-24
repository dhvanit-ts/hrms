import { pgTable, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.table";
import { RoleEnum, users } from "./user.table";

export const userTenants = pgTable("user_tenants", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),

  roles: RoleEnum("roles").array().notNull().default(["user"]),
})