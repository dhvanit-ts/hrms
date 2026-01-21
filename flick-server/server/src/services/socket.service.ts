import { DefaultEventsMap, Server, Socket } from "socket.io";
import { NotificationModel } from "../models/notification.model.js";
import { toObjectId } from "../utils/toObject.js";

const userIdToSocketMap = new Map<string, string>();

class SocketService {
 private handleSocketError = (socket: any, error: any) => {
    console.error(`Socket ${socket.id} error:`, error);
    socket.emit("operation-error", {
      code: error.code || "GENERIC_ERROR",
      message: error.message,
    });
  };

  private getNotificationCount = async (userId: string) => {
    try {
      const notificationCount = await NotificationModel.find({
        receiverId: toObjectId(userId),
        seen: false,
      }).countDocuments();
      return notificationCount ?? 0;
    } catch (error) {
      console.log("Error getting notification count: ", error);
      return 0;
    }
  };

  listenSocket = (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ) => {
    socket.on("initial-setup", async (data) => {
      try {
        const { userId } = data;

        if (!userIdToSocketMap.has(userId)) userIdToSocketMap.set(userId, socket.id);

        const notificationCount = await this.getNotificationCount(userId);
        socket.emit("notification-count", { count: notificationCount });
      } catch (error) {
        this.handleSocketError(socket, error);
      }
    });

    socket.on("disconnect", () => {
      try {
        const userId = socket.handshake.auth.userId;
        if (userIdToSocketMap.has(userId)) userIdToSocketMap.delete(userId);
      } catch (error) {
        this.handleSocketError(socket, error);
      }
    });
  };
}

export { SocketService, userIdToSocketMap };
