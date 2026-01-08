import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./post.table";
import { users } from "./user.table";

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  postId: uuid("postId")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  commentedBy: uuid("commentedBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isBanned: boolean("isBanned").notNull().default(false),
  parentCommentId: uuid("parentCommentId").references(() => comments.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("createdAt", { mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "string" })
    .notNull()
    .defaultNow(),
});
