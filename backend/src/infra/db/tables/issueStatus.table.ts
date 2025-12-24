import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.table";

export const issueStatus = pgTable("issue-status", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  position: integer("position").notNull(),
  isTerminal: boolean("is_terminal").default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp().notNull(),
  deletedAt: timestamp().notNull(),
}, (t) => [
  uniqueIndex("issue_statuses_tenant_name_unique").on(
    t.tenantId,
    t.name
  )
])
