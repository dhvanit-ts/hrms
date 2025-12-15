import { Request, Response } from "express";
import NotificationService from "../services/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import handleError from "../utils/HandleError.js";
import { NotificationModel } from "../models/notification.model.js";

const notificationService = new NotificationService();

const listNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const notifications =
      await notificationService.getMongoNotificationsByUserId(
        req.user._id.toString(),
        true
      );
    res.status(200).json({ notifications });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching notifications",
      "LIST_NOTIFICATIONS_ERROR"
    );
  }
};

const markAsSeen = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { ids } = req.body;
    if (!ids) throw new ApiError(400, "Ids are required");
    if (!Array.isArray(ids)) throw new ApiError(400, "Ids must be an array");

    const notifications = await NotificationModel.updateMany(
      { _id: { $in: ids }, receiverId: req.user._id.toString() },
      { seen: true }
    );

    if (notifications.modifiedCount === 0) {
      throw new ApiError(404, "Notifications not found");
    }

    res.status(200).json({ message: "Notifications marked as seen" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error marking notifications as seen",
      "MARK_AS_SEEN_ERROR"
    );
  }
};

export { listNotifications, markAsSeen };
