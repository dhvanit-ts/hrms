import { and, desc, eq, sql, asc, count } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { posts, users, colleges, votes, bookmarks, comments } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const post = await client.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  return post;
};

export const findByIdWithDetails = async (
  id: string,
  userId?: string,
  dbTx?: DB
) => {
  const client = dbTx ?? db;

  const voteAgg = client.$with("vote_agg").as(
    client
      .select({
        postId: votes.postId,
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
      .where(eq(votes.type, "post"))
      .groupBy(votes.postId)
  );

  const commentCount = client.$with("comment_count").as(
    client
      .select({
        postId: comments.postId,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(comments)
      .where(eq(comments.isBanned, false))
      .groupBy(comments.postId)
  );

  const bookmarkCheck = userId ? client.$with("bookmark_check").as(
    client
      .select({
        postId: bookmarks.postId,
        bookmarked: sql<boolean>`TRUE`.as("bookmarked"),
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
  ) : null;

  const query = client
    .with(voteAgg, commentCount, ...(bookmarkCheck ? [bookmarkCheck] : []))
    .select({
      // Post
      postId: posts.id,
      title: posts.title,
      content: posts.content,
      topic: posts.topic,
      views: posts.views,
      isBanned: posts.isBanned,
      isShadowBanned: posts.isShadowBanned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,

      // Votes
      upvoteCount: sql<number>`COALESCE(${voteAgg.upvoteCount}, 0)`,
      downvoteCount: sql<number>`COALESCE(${voteAgg.downvoteCount}, 0)`,
      userVote: voteAgg.userVote,

      // Comments
      commentsCount: sql<number>`COALESCE(${commentCount.count}, 0)`,

      // Bookmark
      bookmarked: bookmarkCheck ? sql<boolean>`COALESCE(${bookmarkCheck.bookmarked}, FALSE)` : sql<boolean>`FALSE`,

      // Author
      authorId: users.id,
      authorUsername: users.username,
      authorBranch: users.branch,

      // College
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeProfile: colleges.profile,
      collegeEmail: colleges.emailDomain,
    })
    .from(posts)
    .leftJoin(voteAgg, eq(voteAgg.postId, posts.id))
    .leftJoin(commentCount, eq(commentCount.postId, posts.id))
    .leftJoin(users, eq(posts.postedBy, users.id))
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(
      and(
        eq(posts.id, id),
        eq(posts.isBanned, false),
        eq(posts.isShadowBanned, false)
      )
    );

  if (bookmarkCheck) {
    query.leftJoin(bookmarkCheck, eq(bookmarkCheck.postId, posts.id));
  }

  const result = await query.limit(1);
  const row = result[0];

  if (!row) return null;

  return {
    _id: row.postId,
    title: row.title,
    content: row.content,
    topic: row.topic,
    views: row.views,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    upvoteCount: row.upvoteCount,
    downvoteCount: row.downvoteCount,
    userVote: row.userVote,
    commentsCount: row.commentsCount,
    bookmarked: row.bookmarked,

    postedBy: row.authorId
      ? {
          _id: row.authorId,
          username: row.authorUsername,
          branch: row.authorBranch,
          college: row.collegeId
            ? {
                _id: row.collegeId,
                name: row.collegeName,
                profile: row.collegeProfile,
                email: row.collegeEmail,
              }
            : null,
        }
      : null,
  };
};

export const findMany = async (
  options?: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt" | "views";
    sortOrder?: "asc" | "desc";
    topic?: string;
    collegeId?: string;
    branch?: string;
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
        postId: votes.postId,
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
      .where(eq(votes.type, "post"))
      .groupBy(votes.postId)
  );

  const commentCount = client.$with("comment_count").as(
    client
      .select({
        postId: comments.postId,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(comments)
      .where(eq(comments.isBanned, false))
      .groupBy(comments.postId)
  );

  const bookmarkCheck = userId ? client.$with("bookmark_check").as(
    client
      .select({
        postId: bookmarks.postId,
        bookmarked: sql<boolean>`TRUE`.as("bookmarked"),
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
  ) : null;

  let whereConditions = [
    eq(posts.isBanned, false),
    eq(posts.isShadowBanned, false),
  ];

  if (options?.topic) {
    whereConditions.push(eq(posts.topic, options.topic as any));
  }

  if (options?.collegeId) {
    whereConditions.push(eq(colleges.id, options.collegeId));
  }

  if (options?.branch) {
    whereConditions.push(eq(users.branch, options.branch));
  }

  const orderBy = sortOrder === "asc" 
    ? asc(posts[sortBy])
    : desc(posts[sortBy]);

  const query = client
    .with(voteAgg, commentCount, ...(bookmarkCheck ? [bookmarkCheck] : []))
    .select({
      // Post
      postId: posts.id,
      title: posts.title,
      content: posts.content,
      topic: posts.topic,
      views: posts.views,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,

      // Votes
      upvoteCount: sql<number>`COALESCE(${voteAgg.upvoteCount}, 0)`,
      downvoteCount: sql<number>`COALESCE(${voteAgg.downvoteCount}, 0)`,
      userVote: voteAgg.userVote,

      // Comments
      commentsCount: sql<number>`COALESCE(${commentCount.count}, 0)`,

      // Bookmark
      bookmarked: bookmarkCheck ? sql<boolean>`COALESCE(${bookmarkCheck.bookmarked}, FALSE)` : sql<boolean>`FALSE`,

      // Author
      authorId: users.id,
      authorUsername: users.username,
      authorBranch: users.branch,

      // College
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeProfile: colleges.profile,
      collegeEmail: colleges.emailDomain,
    })
    .from(posts)
    .leftJoin(voteAgg, eq(voteAgg.postId, posts.id))
    .leftJoin(commentCount, eq(commentCount.postId, posts.id))
    .leftJoin(users, eq(posts.postedBy, users.id))
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  if (bookmarkCheck) {
    query.leftJoin(bookmarkCheck, eq(bookmarkCheck.postId, posts.id));
  }

  const results = await query;

  return results.map((row) => ({
    _id: row.postId,
    title: row.title,
    content: row.content,
    topic: row.topic,
    views: row.views,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    upvoteCount: row.upvoteCount,
    downvoteCount: row.downvoteCount,
    userVote: row.userVote,
    commentsCount: row.commentsCount,
    bookmarked: row.bookmarked,

    postedBy: row.authorId
      ? {
          _id: row.authorId,
          username: row.authorUsername,
          branch: row.authorBranch,
          college: row.collegeId
            ? {
                _id: row.collegeId,
                name: row.collegeName,
                profile: row.collegeProfile,
                email: row.collegeEmail,
              }
            : null,
        }
      : null,
  }));
};

export const countAll = async (
  filters?: {
    topic?: string;
    collegeId?: string;
    branch?: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  
  let whereConditions = [
    eq(posts.isBanned, false),
    eq(posts.isShadowBanned, false),
  ];

  if (filters?.topic) {
    whereConditions.push(eq(posts.topic, filters.topic as any));
  }

  if (filters?.collegeId) {
    whereConditions.push(eq(colleges.id, filters.collegeId));
  }

  if (filters?.branch) {
    whereConditions.push(eq(users.branch, filters.branch));
  }

  const result = await client
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .leftJoin(users, eq(posts.postedBy, users.id))
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(and(...whereConditions));

  return result[0]?.count || 0;
};

export const create = async (post: typeof posts.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdPost = await client
    .insert(posts)
    .values(post)
    .returning()
    .then((r) => r?.[0] || null);

  return createdPost;
};

export const updateById = async (
  id: string,
  updates: Partial<typeof posts.$inferInsert>,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const updatedPost = await client
    .update(posts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedPost;
};

export const deleteById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const deletedPost = await client
    .delete(posts)
    .where(eq(posts.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return deletedPost;
};

export const incrementViews = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const updatedPost = await client
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedPost;
};