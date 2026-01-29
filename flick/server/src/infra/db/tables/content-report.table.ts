import { pgTable, text, varchar, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

const contentReportTypeEnum = pgEnum("report_type", ["Post", "Comment"])

export const contentReports = pgTable("content_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: contentReportTypeEnum("type").notNull(), // "Post" | "Comment"
  postId: uuid("post_id"),
  commentId: uuid("comment_id"),
  reportedBy: uuid("reported_by").notNull(), // references users.id
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ContentReportSelect = typeof contentReports.$inferSelect;
export type ContentReportInsert = typeof contentReports.$inferInsert;
