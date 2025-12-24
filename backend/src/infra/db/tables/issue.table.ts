import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./project.table";
import { users } from "./user.table";
import { issueStatus } from "./issueStatus.table";

const priorityEnum = pgEnum("priority_enum", ["urgent", "high", "medium", "low"])

export const issues = pgTable("issue", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  assigneeId: uuid("assginee_id").references(() => users.id),
  status: uuid("status").notNull().references(() => issueStatus.id),
  priority: priorityEnum("priority").default("medium"),
  parentIssue: uuid("parent_issue").references(() => issues.id),

  dueAt: timestamp("due_at"),
  breachedAt: timestamp("breached_at")
})
