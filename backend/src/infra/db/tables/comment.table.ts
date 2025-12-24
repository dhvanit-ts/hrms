import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { issues } from "./issue.table";
import { users } from "./user.table";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey(),
  content: text("content"),
  issueId: uuid("issue_id").notNull().references(() => issues.id),
  authorId: uuid("author_id").notNull().references(() => users.id),

  isDeleted: boolean("is_deleted").default(false),
  visibility: text("visibility"),

  createdAt: timestamp("created_at"),
})