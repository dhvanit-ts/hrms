import { and, desc, eq, sql } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { bookmarks, colleges, posts, users, votes } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.bookmarks.findFirst({
    where: eq(bookmarks.id, id),
  });

  return user;
};

export const findByUserAndPostId = async (userId: string, postId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)),
  });

  return user;
}

export const findByUserAndPostIdWithPost = async (userId: string, postId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)),
    with: {
      post: true,
    },
  });

  return user;
}

export const deleteBookmarkByUserAndPostId = async (userId: string, postId: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));

  return user;
}

export const create = async (bookmark: typeof bookmarks.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdUser = await client
    .insert(bookmarks)
    .values(bookmark)
    .returning()
    .then((r) => r?.[0] || null);

  return createdUser;
};

export const findBookmarkedPostsByUserId = async (userId: string, dbTx?: DB) => {
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
        userVote: sql<"upvote" | "downvote" | null>`
          MAX(
            CASE
              WHEN ${votes.userId} = ${userId}
              THEN ${votes.voteType}
            END
          )
        `.as("userVote"),
      })
      .from(votes)
      .where(eq(votes.type, "post"))
      .groupBy(votes.postId)
  );

  const rows = await client
    .with(voteAgg)
    .select({
      // Post
      postId: posts.id,
      title: posts.title,
      content: posts.content,
      views: posts.views,
      createdAt: posts.createdAt,
      topic: posts.topic,

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
      collegeEmail: colleges.emailDomain,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .leftJoin(voteAgg, eq(voteAgg.postId, posts.id))
    .leftJoin(users, eq(posts.postedBy, users.id))
    .leftJoin(colleges, eq(users.collegeId, colleges.id))
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(posts.isBanned, false),
        eq(posts.isShadowBanned, false)
      )
    )
    .orderBy(desc(posts.createdAt));

  const results = rows.map((r) => ({
    _id: r.postId,
    title: r.title,
    content: r.content,
    views: r.views,
    createdAt: r.createdAt,
    topic: r.topic,
    upvoteCount: r.upvoteCount,
    downvoteCount: r.downvoteCount,
    userVote: r.userVote,
    bookmarked: true,

    postedBy: r.authorId
      ? {
          _id: r.authorId,
          username: r.authorUsername,
          branch: r.authorBranch,
          college: r.collegeId
            ? {
                _id: r.collegeId,
                name: r.collegeName,
                profile: r.collegeProfile,
                email: r.collegeEmail,
              }
            : null,
        }
      : null,
  }));

  return results;
};
