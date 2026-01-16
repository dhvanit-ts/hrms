import { PostAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";
import postCacheKeys from "./post.cache-keys";

const PostRepo = {
  CachedRead: {
    findById: (id: string, dbTx?: DB) =>
      cached(postCacheKeys.id(id), () => PostAdapter.findById(id, dbTx)),

    findAuthorId: (id: string, dbTx?: DB) =>
      cached(postCacheKeys.id(id), () => PostAdapter.findAuthorId(id, dbTx)),

    findByIdWithDetails: (id: string, userId?: string, dbTx?: DB) =>
      cached(postCacheKeys.idWithDetails(id, userId), () => PostAdapter.findByIdWithDetails(id, userId, dbTx)),

    findMany: (
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
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "desc";
      const topic = options?.topic;
      const collegeId = options?.collegeId;
      const branch = options?.branch;
      const userId = options?.userId;

      return cached(
        postCacheKeys.many(page, limit, sortBy, sortOrder, topic, collegeId, branch, userId),
        () => PostAdapter.findMany(options, dbTx)
      );
    },

    countAll: (
      filters?: {
        topic?: string;
        collegeId?: string;
        branch?: string;
      },
      dbTx?: DB
    ) => cached(postCacheKeys.count(filters?.topic, filters?.collegeId, filters?.branch), () => PostAdapter.countAll(filters, dbTx)),
  },

  Read: {
    findById: (id: string, dbTx?: DB) => PostAdapter.findById(id, dbTx),

    findByIdWithDetails: (id: string, userId?: string, dbTx?: DB) => PostAdapter.findByIdWithDetails(id, userId, dbTx),

    findMany: (
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
    ) => PostAdapter.findMany(options, dbTx),

    countAll: (
      filters?: {
        topic?: string;
        collegeId?: string;
        branch?: string;
      },
      dbTx?: DB
    ) => PostAdapter.countAll(filters, dbTx),
  },

  Write: {
    create: PostAdapter.create,
    updateById: PostAdapter.updateById,
    deleteById: PostAdapter.deleteById,
    incrementViews: PostAdapter.incrementViews
  }
}

export default PostRepo