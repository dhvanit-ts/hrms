import { FeedbackAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";
import feedbackCacheKeys from "./feedback.cache-keys";

const FeedbackRepo = {
  CachedRead: {
    findById: (id: string, dbTx?: DB) =>
      cached(feedbackCacheKeys.id(id), () => FeedbackAdapter.findById(id, dbTx)),

    findByIdWithUser: (id: string, dbTx?: DB) =>
      cached(feedbackCacheKeys.id(id), () => FeedbackAdapter.findByIdWithUser(id, dbTx)),

    findAll: (
      options?: {
        limit?: number;
        skip?: number;
        type?: string;
        status?: string;
      },
      dbTx?: DB
    ) => {
      const limit = options?.limit || 50;
      const skip = options?.skip || 0;
      const type = options?.type;
      const status = options?.status;

      return cached(
        feedbackCacheKeys.all(limit, skip, type, status),
        () => FeedbackAdapter.findAll(options, dbTx)
      );
    },

    countAll: (
      filters?: {
        type?: string;
        status?: string;
      },
      dbTx?: DB
    ) => cached(feedbackCacheKeys.count(filters?.type, filters?.status), () => FeedbackAdapter.countAll(filters, dbTx))
  },

  Read: {
    findById: (id: string, dbTx?: DB) => FeedbackAdapter.findById(id, dbTx),

    findByIdWithUser: (id: string, dbTx?: DB) =>
      cached(feedbackCacheKeys.id(id), () => FeedbackAdapter.findByIdWithUser(id, dbTx)),

    findAll: (
      options?: {
        limit?: number;
        skip?: number;
        type?: string;
        status?: string;
      },
      dbTx?: DB
    ) => FeedbackAdapter.findAll(options, dbTx),

    countAll: (
      filters?: {
        type?: string;
        status?: string;
      },
      dbTx?: DB
    ) => FeedbackAdapter.countAll(filters, dbTx)
  },

  Write: {
    create: FeedbackAdapter.create,
    updateById: FeedbackAdapter.updateById,
    deleteById: FeedbackAdapter.deleteById,
  }
}

export default FeedbackRepo