import { and, desc, eq, sql, asc } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { comments, posts, users, colleges, votes } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const comment = await client.query.comments.findFirst({
    where: eq(comments.id, id),
  });

  return comment;
};

export const findAuthorId = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const result = await client.select({ postedBy: comments.postedBy })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  return result[0].postedBy;
}

export const findByPostId = async (
  postId: string,
  options?: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
    userId?: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const sortBy = options?.sortBy || "createdAt";
  const sortOrder = options?.sortOrder || "desc";
  const userId = options?.userId;

  const voteAgg = client.$with("vote_agg").as(
    client
      .select({
        commentId: votes.commentId,
        upvoteCount: sql<number>`
          COUNT(*) FILTER (WHERE ${votes.voteType} = 'upvote')
        `.as("upvoteCount"),
        downvoteCount: sql<number>`
          COUNT(*) FILTER (WHERE ${votes.voteType} = 'downvote')
        `.as("downvoteCount"),
        userVote: userId ? sql<"upvote" | "downvote" | null>`
          MAX(
            CASE
              WHEN ${votes.userId} = ${userId}
              THEN ${votes.voteType}
            END
          )
        `.as("userVote") : sql<null>`NULL`.as("userVote"),
      })
      .from(votes)
      .where(eq(votes.type, "comment"))
      .groupBy(votes.commentId)
  );

  const orderBy = sortOrder === "asc"
    ? asc(comments[sortBy])
    : desc(comments[sortBy]);

  const rows = await client
    .with(voteAgg)
    .select({
      // Comment
      commentId: comments.id,
      content: comments.content,
      postId: comments.postId,
      parentCommentId: comments.parentCommentId,
      isBanned: comments.isBanned,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,

      // Votes
      upvoteCount: sql<number>`COALESCE(${voteAgg.upvoteCount}, 0)`,
      downvoteCount: sql<number>`COALESCE(${voteAgg.downvoteCount}, 0)`,
      userVote: voteAgg.userVote,

      // Author
      authorId: users.id,
      authorUsername: users.username,
      authorBranch: users.branch,

      // College
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeProfile: colleges.profile,
    })
    .from(comments)
    .leftJoin(voteAgg, eq(voteAgg.commentId, comments.id))
    .leftJoin(users, eq(comments.commentedBy, users.id))
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(
      and(
        eq(comments.postId, postId),
        eq(comments.isBanned, false)
      )
    )
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const results = rows.map((r) => ({
    id: r.commentId,
    content: r.content,
    postId: r.postId,
    parentCommentId: r.parentCommentId,
    isBanned: r.isBanned,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    upvoteCount: r.upvoteCount,
    downvoteCount: r.downvoteCount,
    userVote: r.userVote,

    commentedBy: r.authorId
      ? {
        id: r.authorId,
        username: r.authorUsername,
        branch: r.authorBranch,
        college: r.collegeId
          ? {
            id: r.collegeId,
            name: r.collegeName,
            profile: r.collegeProfile,
          }
          : null,
      }
      : null,
  }));

  return results;
};

export const countByPostId = async (postId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const result = await client
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(
      and(
        eq(comments.postId, postId),
        eq(comments.isBanned, false)
      )
    );

  return result[0]?.count || 0;
};

export const create = async (comment: typeof comments.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdComment = await client
    .insert(comments)
    .values(comment)
    .returning()
    .then((r) => r?.[0] || null);

  return createdComment;
};

export const updateById = async (
  id: string,
  updates: Partial<typeof comments.$inferInsert>,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const updatedComment = await client
    .update(comments)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(comments.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedComment;
};

export const deleteById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const deletedComment = await client
    .delete(comments)
    .where(eq(comments.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return deletedComment;
};

export const findByIdWithAuthor = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const result = await client
    .select({
      commentId: comments.id,
      content: comments.content,
      postId: comments.postId,
      parentCommentId: comments.parentCommentId,
      isBanned: comments.isBanned,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      commentedBy: comments.commentedBy,

      authorId: users.id,
      authorUsername: users.username,
      authorBranch: users.branch,
    })
    .from(comments)
    .leftJoin(users, eq(comments.commentedBy, users.id))
    .where(eq(comments.id, id))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  return {
    _id: row.commentId,
    content: row.content,
    postId: row.postId,
    parentCommentId: row.parentCommentId,
    isBanned: row.isBanned,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    commentedBy: row.commentedBy,

    author: row.authorId
      ? {
        _id: row.authorId,
        username: row.authorUsername,
        branch: row.authorBranch,
      }
      : null,
  };
};