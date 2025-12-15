import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.table";

export const topicEnum = pgEnum("topic_enum", [
  "Ask Flick", // AMA-style Q&A
  "Serious Discussion", // Longform thought, critical debate
  "Career Advice", // Jobs, interviews, tech growth
  "Showcase", // Demos, projects, portfolios
  "Off-topic", // Memes, casual chatter
  "Community Event", // Fests, announcements, contests
  "Rant / Vent", // Emotional unloads, safe zone
  "Help / Support", // “Stuck on X”, troubleshooting
  "Feedback / Suggestion", // Feature requests, bug reports
  "News / Update", // Industry news, changelogs, announcements
  "Guide / Resource", // Tutorials, resources, link dumps
]);

export const posts = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  postedBy: uuid("postedBy").references(() => users.id),
  topic: topicEnum("topic").notNull(),
  isBanned: boolean("isBanned").default(false),
  isShadowBanned: boolean("isShadowBanned").default(false),
  views: integer("views").default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("posts_visibility_idx").on(table.isBanned, table.isShadowBanned, table.createdAt.desc()),
]);
