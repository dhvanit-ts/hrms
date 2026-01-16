import { CommentAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";
import commentCacheKeys from "./comment.cache-keys";

const CommentRepo = {
  CachedRead: {
    findById: (id: string, dbTx?: DB) =>
      cached(commentCacheKeys.id(id), () => CommentAdapter.findById(id, dbTx)),

    findAuthorId: (id: string, dbTx?: DB) =>
      cached(commentCacheKeys.id(id), () => CommentAdapter.findAuthorId(id, dbTx)),

    findByIdWithAuthor: (id: string, dbTx?: DB) =>
      cached(commentCacheKeys.id(id), () => CommentAdapter.findByIdWithAuthor(id, dbTx)),

    findByPostId: (
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
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "desc";
      const userId = options?.userId;

      return cached(
        commentCacheKeys.postComments(postId, page, limit, sortBy, sortOrder, userId),
        () => CommentAdapter.findByPostId(postId, options, dbTx)
      );
    },

    countByPostId: (postId: string, dbTx?: DB) =>
      cached(commentCacheKeys.postCount(postId), () => CommentAdapter.countByPostId(postId, dbTx))
  },

  Read: {
    findById: (id: string, dbTx?: DB) => CommentAdapter.findById(id, dbTx),

    findByIdWithAuthor: (id: string, dbTx?: DB) => CommentAdapter.findByIdWithAuthor(id, dbTx),

    findByPostId: (
      postId: string,
      options?: {
        page?: number;
        limit?: number;
        sortBy?: "createdAt" | "updatedAt";
        sortOrder?: "asc" | "desc";
        userId?: string;
      },
      dbTx?: DB
    ) => CommentAdapter.findByPostId(postId, options, dbTx),

    countByPostId: (postId: string, dbTx?: DB) => CommentAdapter.countByPostId(postId, dbTx)
  },

  Write: {
    create: CommentAdapter.create,
    updateById: CommentAdapter.updateById,
    deleteById: CommentAdapter.deleteById
  }
}

export default CommentRepo