import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user.table";

export const feedbacks = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),

  type: text("type")
    .notNull(),

  title: text("title")
    .notNull(),

  content: text("content")
    .notNull(),

  status: text("status")
    .notNull(),

  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export type FeedbackSelect = typeof feedbacks.$inferSelect;
export type FeedbackInsert = typeof feedbacks.$inferInsert;
