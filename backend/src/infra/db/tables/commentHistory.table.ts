import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { comments } from "./comment.table";
import { users } from "./user.table";

export const commentHistory = pgTable("comment-history", {
  id: uuid("id").primaryKey(),
  commentId: uuid("commentId").notNull().references(() => comments.id),
  fromtContent: text("from_content").notNull(),
  toContent: text("to_content").notNull(),
  changedBy: uuid("changed_id").notNull().references(() => users.id),
  changedAt: timestamp("changed_at")
})