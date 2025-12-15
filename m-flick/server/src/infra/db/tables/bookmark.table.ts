import { pgTable, uuid, index, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./post.table";
import { users } from "./user.table";

export const bookmarks = pgTable("bookmark", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId").references(() => posts.id),
  userId: uuid("userId").references(() => users.id).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("bookmark_user_id_idx").on(table.userId, table.postId),
]);