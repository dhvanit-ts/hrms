import {
  pgEnum,
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { posts } from "./post.table";

export const notificationType = pgEnum("notification_type", [
  "general",
  "upvoted_post",
  "upvoted_comment",
  "replied",
  "posted",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  seen: boolean("seen").notNull().default(false),
  postId: integer("postId").references(() => posts.id).default(null),
  receiverId: text("receiverId").notNull(),
  actorUsernames: jsonb("actorUsernames").$type<string[]>().notNull(),
  content: text("content").default(null),
  type: notificationType("type").notNull().default("general"),

  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
