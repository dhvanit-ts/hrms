import { Request, Response } from "express";
import FeedbackModel from "../models/feedback.model.js";
import handleError from "../utils/HandleError.js";
import { toObjectId } from "../utils/toObject.js";
import { ApiError } from "../utils/ApiError.js";
import { logEvent } from "../services/log.service.js";

export async function createFeedback(req: Request, res: Response) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { title, content, type = "feedback" } = req.body;

    if (!title || !content) throw new ApiError(400, "All fields are required");

    const feedback = await FeedbackModel.create({
      userId: toObjectId(req.user._id),
      title,
      content,
      type,
    });

    if (!feedback) throw new ApiError(400, "Failed to create feedback");

    logEvent({
      req,
      action: "user_created_feedback",
      platform: "web",
      metadata: {
        feedbackId: feedback._id,
        type
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res.status(201).json(feedback);
  } catch (error) {
    handleError(error, res, "Error creating feedback", "CREATE_FEEDBACK_ERROR");
  }
}

export async function getFeedbackById(req: Request, res: Response) {
  try {
    if (!req.admin) throw new ApiError(401, "Unauthorized");

    const { id } = req.params;
    if (!id) throw new ApiError(400, "Feedback ID is required");

    const feedback = await FeedbackModel.findById(toObjectId(id));
    if (!feedback) throw new ApiError(404, "Feedback not found");
    res.status(200).json(feedback);
  } catch (error) {
    handleError(error, res, "Failed to fetch feedback", "GET_FEEDBACK_ERROR");
  }
}

export async function listFeedbacks(req: Request, res: Response) {
  try {
    if (!req.admin) throw new ApiError(401, "Unauthorized");
    const { limit = "50", skip = "0" } = req.query;
    
    const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
    const parsedSkip = Math.max(0, Number(skip));
    
    const feedbacks = await FeedbackModel.find()
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .skip(parsedSkip)
      .lean();

    if (!feedbacks) throw new ApiError(404, "Feedbacks not found");
    res.status(200).json(feedbacks);
  } catch (error) {
    handleError(error, res, "Failed to list feedbacks", "LIST_FEEDBACKS_ERROR");
  }
}

export async function updateFeedbackStatus(req: Request, res: Response) {
  try {
    if (!req.admin) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;
    const { status } = req.body;

    if (["new", "reviewed", "dismissed"].includes(status) === false) {
      throw new ApiError(400, "Invalid status value");
    }

    const updatedFeedback = await FeedbackModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedFeedback) throw new ApiError(404, "Feedback not found");

    logEvent({
      req,
      action: "admin_updated_feedback_status",
      platform: "web",
      metadata: {
        feedbackId: id,
        status: status,
        type: updatedFeedback.type,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res.status(200).json(updatedFeedback);
  } catch (error) {
    handleError(
      error,
      res,
      "Failed to update feedback",
      "UPDATE_FEEDBACK_ERROR"
    );
  }
}

export async function deleteFeedback(req: Request, res: Response) {
  try {
    if (!req.admin) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const deletedFeedback = await FeedbackModel.findByIdAndDelete(id);
    if (!deletedFeedback) throw new ApiError(404, "Feedback not found");

    logEvent({
      req,
      action: "admin_deleted_feedback",
      platform: "web",
      metadata: {
        feedbackId: id,
        type: deletedFeedback.type,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res.status(200).json({ message: "Feedback successfully deleted" });
  } catch (error) {
    handleError(
      error,
      res,
      "Failed to delete feedback",
      "DELETE_FEEDBACK_ERROR"
    );
  }
}
