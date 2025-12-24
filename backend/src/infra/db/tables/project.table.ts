import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.table";
import { teams } from "./team.table";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  ownedBy: uuid("owned_by").references(() => teams.id).notNull()
})