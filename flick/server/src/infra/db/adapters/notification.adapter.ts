import db from "@/infra/db/index";
import { notifications, posts } from "../tables";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { DB } from "../types";

export const markNotificationsAsSeen = async (ids: string[], dbTx?: DB) => {
  if (!ids.length) return;

  const client = dbTx ?? db;

  await client
    .update(notifications)
    .set({ seen: true })
    .where(inArray(notifications.id, ids))
    .returning();
}

export const getLatestNotifications = async (userId: string, limit: number, dbTx?: DB) => {
  const client = dbTx ?? db;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return await client
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.receiverId, userId),
        gte(notifications.createdAt, twentyFourHoursAgo)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export const getAllJoinedNotifications = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? db;

  return await client
    .select({
      id: notifications.id,
      receiverId: notifications.receiverId,
      createdAt: notifications.createdAt,

      post: {
        id: posts.id,
        title: posts.title,
        content: posts.content,
      },
    })
    .from(notifications)
    .leftJoin(posts, eq(notifications.postId, posts.id))
    .where(eq(notifications.receiverId, userId))
    .orderBy(desc(notifications.createdAt));
}

export const getAllNotifications = async (userId: string, dbTx?: DB) => {
  const client = dbTx ?? db;

  return await client
    .select()
    .from(notifications)
    .where(eq(notifications.receiverId, userId))
    .orderBy(desc(notifications.createdAt));
}

export const create = async (notification: typeof notifications.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdNotification = await client
    .insert(notifications)
    .values(notification)
    .returning()
    .then((r) => r?.[0] || null);

  return createdNotification;
};