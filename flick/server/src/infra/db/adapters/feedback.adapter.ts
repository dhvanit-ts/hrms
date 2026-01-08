import { and, desc, eq, ilike, or } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { feedbacks, users } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const feedback = await client.query.feedbacks.findFirst({
    where: eq(feedbacks.id, id),
  });

  return feedback;
};

export const findByIdWithUser = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const result = await client
    .select({
      feedbackId: feedbacks.id,
      userId: feedbacks.userId,
      type: feedbacks.type,
      title: feedbacks.title,
      content: feedbacks.content,
      status: feedbacks.status,
      createdAt: feedbacks.createdAt,
      updatedAt: feedbacks.updatedAt,
      
      authorId: users.id,
      authorUsername: users.username,
      authorEmail: users.email,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.userId, users.id))
    .where(eq(feedbacks.id, id))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  return {
    _id: row.feedbackId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    content: row.content,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    
    user: row.authorId
      ? {
          _id: row.authorId,
          username: row.authorUsername,
          email: row.authorEmail,
        }
      : null,
  };
};

export const findAll = async (
  options?: {
    limit?: number;
    skip?: number;
    type?: string;
    status?: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const limit = options?.limit || 50;
  const skip = options?.skip || 0;

  let whereConditions = [];
  
  if (options?.type) {
    whereConditions.push(eq(feedbacks.type, options.type));
  }
  
  if (options?.status) {
    whereConditions.push(eq(feedbacks.status, options.status));
  }

  const results = await client
    .select({
      feedbackId: feedbacks.id,
      userId: feedbacks.userId,
      type: feedbacks.type,
      title: feedbacks.title,
      content: feedbacks.content,
      status: feedbacks.status,
      createdAt: feedbacks.createdAt,
      updatedAt: feedbacks.updatedAt,
      
      authorId: users.id,
      authorUsername: users.username,
      authorEmail: users.email,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.userId, users.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(feedbacks.createdAt))
    .limit(limit)
    .offset(skip);

  return results.map((row) => ({
    _id: row.feedbackId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    content: row.content,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    
    user: row.authorId
      ? {
          _id: row.authorId,
          username: row.authorUsername,
          email: row.authorEmail,
        }
      : null,
  }));
};

export const countAll = async (
  filters?: {
    type?: string;
    status?: string;
  },
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  
  let whereConditions = [];
  
  if (filters?.type) {
    whereConditions.push(eq(feedbacks.type, filters.type));
  }
  
  if (filters?.status) {
    whereConditions.push(eq(feedbacks.status, filters.status));
  }

  const result = await client
    .select({ count: feedbacks.id })
    .from(feedbacks)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  return result.length;
};

export const create = async (feedback: typeof feedbacks.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdFeedback = await client
    .insert(feedbacks)
    .values(feedback)
    .returning()
    .then((r) => r?.[0] || null);

  return createdFeedback;
};

export const updateById = async (
  id: string,
  updates: Partial<typeof feedbacks.$inferInsert>,
  dbTx?: DB
) => {
  const client = dbTx ?? db;
  const updatedFeedback = await client
    .update(feedbacks)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(feedbacks.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedFeedback;
};

export const deleteById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const deletedFeedback = await client
    .delete(feedbacks)
    .where(eq(feedbacks.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return deletedFeedback;
};