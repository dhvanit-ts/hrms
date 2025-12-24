import { pgEnum, pgTable, uuid, text, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.table";

export const teams = pgTable("team", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  isArchived: boolean("is_archived").default(false)
})