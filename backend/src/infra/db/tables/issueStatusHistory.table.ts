import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.table";
import { issues } from "./issue.table";
import { issueStatus } from "./issueStatus.table";
import { users } from "./user.table";

export const issueStatusHistory = pgTable("issue_status_history", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  issueId: uuid("issue_id").notNull().references(() => issues.id),
  fromStatus: uuid("from_status").notNull().references(() => issueStatus.id),
  toStatus: uuid("to_status").notNull().references(() => issueStatus.id),
  changedBy: uuid("changed_id").notNull().references(() => users.id),
  changedAt: timestamp("changed_at")
})