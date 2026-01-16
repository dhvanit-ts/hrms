import { index, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { posts } from "./post.table";
import { comments } from "./comment.table";
import { users } from "./user.table";
import { eq } from "drizzle-orm";

export const voteTypeEnum = pgEnum("vote_type_enum", [
  "upvote",
  "downvote",
]);

export const VoteEntityEnum = pgEnum("vote_entity_enum", [
  "post",
  "comment",
]);

export const votes = pgTable("vote", {
  id: uuid("id").defaultRandom().primaryKey(),

  postId: uuid("postId")
    .references(() => posts.id, { onDelete: "cascade" }).unique("votes_user_post_unique"),

  commentId: uuid("commentId")
    .references(() => comments.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" }).unique("votes_user_post_unique"),

  voteType: voteTypeEnum("voteType").notNull(),

  targetType: VoteEntityEnum("targetType").notNull(),
}, (table) => [
  index("votes_user_post_unique").on(table.userId, table.postId).where(eq(table.targetType, "post")),
  index("votes_post_type_idx").on(table.postId, table.targetType),
]);

export type VoteSelect = typeof votes.$inferSelect;
export type VoteInsert = typeof votes.$inferInsert;
