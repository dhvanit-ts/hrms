import { relations } from "drizzle-orm";
import { users } from "./user.table";
import { posts } from "./post.table";
import { bookmarks } from "./bookmark.table";
import { votes } from "./vote.table";
import { contentReports } from "./content-report.table";
import { comments } from "./comment.table";

// User — has posts, bookmarks, votes
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  bookmarks: many(bookmarks),
  votes: many(votes),
}));

// Post — belongs to user; has votes; has bookmarks
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.postedBy],
    references: [users.id],
  }),
  votes: many(votes),
  bookmarks: many(bookmarks),
}));

// Bookmark — belongs to user and post
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));

// Vote — belongs to user and post
export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [votes.postId],
    references: [posts.id],
  }),
}));

export const contentReportRelations = relations(contentReports, ({ one }) => ({
  user: one(users, {
    fields: [contentReports.reportedBy],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [contentReports.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [contentReports.commentId],
    references: [comments.id],
  }),
}));
