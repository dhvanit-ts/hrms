import { v4 as uuid } from "uuid";
import { userIdToSocketMap } from "./socket.service.js";
import NotificationRepo from "./notification.repo.js";
import socketService from "@/infra/services/socket/index.js";
import logger from "@/core/logger";

const io = socketService.get();

type NotificationType =
  | "general"
  | "upvoted_post"
  | "upvoted_comment"
  | "replied"
  | "posted";

type BaseNotification = {
  postId: number;
  receiverId: string;
  type: NotificationType;
  content?: string;
};
export type Notification = BaseNotification & {
  actorUsernames: string[];
  id?: number;
};
export type RawNotification = BaseNotification & { actorUsername: string };

export default class NotificationService {
  private static async emitNotificationIfOnline(
    notification: RawNotification
  ): Promise<boolean> {
    logger.debug("Attempting to emit notification", { 
      receiverId: notification.receiverId, 
      type: notification.type 
    });
    
    const socketId = userIdToSocketMap.get(notification.receiverId.toString());
    if (socketId) {
      io.to(socketId).emit("notification", {
        ...notification,
        id: uuid(),
      });
      logger.info("Notification emitted to online user", { 
        receiverId: notification.receiverId, 
        type: notification.type,
        socketId 
      });
      return true;
    }
    
    logger.debug("User not online, notification not emitted", { 
      receiverId: notification.receiverId 
    });
    return false;
  }

  public static bundleNotifications = (
    rawNotifications: Notification[]
  ): {
    bundled: Notification[];
    deleteIds: string[];
  } => {
    const bundleMap = new Map<
      string,
      {
        postId: number;
        receiverId: string;
        type: Notification["type"];
        content?: string;
        actorSet: Set<string>;
        originalIds: string[];
      }
    >();

    for (const raw of rawNotifications) {
      if (!raw.id) continue;
      const key = `${raw.receiverId}:${raw.postId}:${raw.type}:${raw.content || ""
        }`;
      const existing = bundleMap.get(key);

      const currentActors = raw.actorUsernames || [];

      if (!existing) {
        bundleMap.set(key, {
          postId: raw.postId,
          receiverId: raw.receiverId,
          type: raw.type,
          content: raw.content,
          actorSet: new Set(currentActors),
          originalIds: [raw.id.toString()],
        });
      } else {
        currentActors.forEach((username) => existing.actorSet.add(username));
        existing.originalIds.push(raw.id.toString());
      }
    }

    const bundled: Notification[] = [];
    const deleteIds: string[] = [];

    for (const {
      postId,
      receiverId,
      type,
      content,
      actorSet,
      originalIds,
    } of bundleMap.values()) {
      const notification: Notification = {
        postId,
        receiverId,
        type,
        content,
        actorUsernames: Array.from(actorSet).sort(), // sorted for deterministic UI
      };

      bundled.push(notification);
      deleteIds.push(...originalIds.slice(1)); // keep first, delete rest
    }

    return { bundled, deleteIds };
  };

  public static async handleNotification(
    notification: RawNotification
  ): Promise<void> {
    logger.info("Handling notification", { 
      receiverId: notification.receiverId, 
      type: notification.type,
      postId: notification.postId 
    });
    
    await NotificationService.emitNotificationIfOnline(notification);
    await NotificationService.insertNotificationToDB(notification);
    
    logger.info("Notification handled successfully", { 
      receiverId: notification.receiverId, 
      type: notification.type 
    });
  }

  public getLast24HourNotifications = async (userId: string, limit = 1000) => {
    try {
      const notifications = await NotificationRepo.Read.getLatestNotifications(
        userId,
        limit
      );

      return notifications;
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      throw new Error("Unable to retrieve notifications.");
    }
  };

  chunkToEntries(fields: string[]): [string, string][] {
    const entries: [string, string][] = [];
    for (let i = 0; i < fields.length; i += 2) {
      entries.push([fields[i], fields[i + 1]]);
    }
    return entries;
  }

  public static async getNotificationsByUserId(userId: string, populate = false) {
    let notifications;
    if (populate) {
      const rawNotifications = await NotificationRepo.CachedRead.getAllJoinedNotifications(
        userId
      );

      notifications = rawNotifications.map((n) => ({
        ...n,
        post: n.post.id,
        postId: undefined,
      }));
    } else {
      notifications = await NotificationRepo.CachedRead.getAllNotifications(
        userId,
      );
    }
    return notifications;
  }

  public static async insertNotificationToDB(
    notification: RawNotification
  ): Promise<boolean> {
    try {
      const data = {
        postId: notification.postId,
        receiverId: notification.receiverId,
        type: notification.type,
        content: notification.content ?? undefined,
        actorUsernames: [notification.actorUsername],
      };
      const result = await NotificationRepo.Write.create(data);

      if (!result) {
        console.log("Error inserting to Mongo");
        return false;
      }

      return true;
    } catch (err: any) {
      console.log("Error inserting to Mongo", err);
      return false;
    }
  }
}
