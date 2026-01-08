import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import handleError from "../utils/HandleError.js";
import NotificationRepo from "./notification.repo.js";
import NotificationService from "./notification.service.js";

const listNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const notifications =
      await NotificationService.getNotificationsByUserId(
        req.user.id.toString(),
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

    await NotificationRepo.Write.markNotificationsAsSeen(req.user.id, ids);

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
