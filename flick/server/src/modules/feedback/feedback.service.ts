import { HttpError } from "@/core/http";
import FeedbackRepo from "./feedback.repo";
import recordAudit from "@/lib/record-audit";
import logger from "@/core/logger";
import { shouldSampleLog } from "@/lib/should-sample-log";
import { observabilityContext } from "../audit/audit-context";

class FeedbackService {
  async createFeedback(feedbackData: {
    title: string;
    content: string;
    type: "feedback" | "bug" | "feature" | "other";
    userId: string;
  }) {

    const newFeedback = await FeedbackRepo.Write.create({
      title: feedbackData.title.trim(),
      content: feedbackData.content.trim(),
      type: feedbackData.type,
      userId: feedbackData.userId,
      status: "new", // Default status for new feedback
    });

    if (shouldSampleLog()) logger.info("Feedback created successfully", {
      feedbackId: newFeedback.id,
      type: newFeedback.type,
      userId: newFeedback.userId
    });

    await recordAudit({
      action: "user:created:feedback",
      entityType: "feedback",
      entityId: newFeedback.id,
      after: { id: newFeedback.id },
      metadata: { type: newFeedback.type }
    })

    return newFeedback;
  }

  async getFeedbackById(id: string, includeUser = false) {
    const ctx = observabilityContext.getStore()
    if (shouldSampleLog(ctx.requestId)) logger.info("Fetching feedback by ID", { feedbackId: id, includeUser });

    const feedback = includeUser
      ? await FeedbackRepo.CachedRead.findByIdWithUser(id)
      : await FeedbackRepo.CachedRead.findById(id);

    if (!feedback) {
      logger.warn("Feedback not found", { feedbackId: id });
      throw HttpError.notFound("Feedback not found", {
        code: "FEEDBACK_NOT_FOUND",
        meta: { source: "FeedbackService.getFeedbackById" },
        errors: [{ field: "id", message: "Feedback not found" }],
      });
    }

    if (shouldSampleLog(ctx.requestId)) logger.info("Feedback retrieved successfully", { feedbackId: id, type: feedback.type });
    return feedback;
  }

  async listFeedbacks(options?: {
    limit?: number;
    skip?: number;
    type?: "feedback" | "bug" | "feature" | "other";
    status?: "new" | "reviewed" | "dismissed";
  }) {
    logger.info("Listing feedbacks", { options });
    
    const feedbacks = await FeedbackRepo.CachedRead.findAll(options);
    const totalCount = await FeedbackRepo.CachedRead.countAll({
      type: options?.type,
      status: options?.status,
    });

    const limit = options?.limit || 50;
    const skip = options?.skip || 0;

    logger.info("Retrieved feedbacks list", { 
      count: feedbacks.length, 
      totalCount, 
      limit, 
      skip 
    });

    return {
      feedbacks,
      meta: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + feedbacks.length < totalCount,
      },
    };
  }

  async updateFeedbackStatus(
    id: string,
    status: "new" | "reviewed" | "dismissed"
  ) {
    // Check if feedback exists
    const existing = await FeedbackRepo.CachedRead.findById(id);
    if (!existing) {
      throw HttpError.notFound("Feedback not found", {
        code: "FEEDBACK_NOT_FOUND",
        meta: { source: "FeedbackService.updateFeedbackStatus" },
        errors: [{ field: "id", message: "Feedback not found" }],
      });
    }
    
    const updatedFeedback = await FeedbackRepo.Write.updateById(id, { status });

    await recordAudit({
      action: "admin:updated:status:feedback",
      entityType: "feedback",
      entityId: updatedFeedback.id,
      before: { status: existing.status },
      after: { status },
    })

    return updatedFeedback;
  }

  async deleteFeedback(id: string) {
    const existing = await FeedbackRepo.CachedRead.findById(id);
    if (!existing) {
      throw HttpError.notFound("Feedback not found", {
        code: "FEEDBACK_NOT_FOUND",
        meta: { source: "FeedbackService.deleteFeedback" },
        errors: [{ field: "id", message: "Feedback not found" }],
      });
    }

    const deletedFeedback = await FeedbackRepo.Write.deleteById(id);

    await recordAudit({
      action: "admin:deleted:feedback",
      entityType: "feedback",
      entityId: deletedFeedback.id,
      before: { status: existing.status, id: deletedFeedback.id },
    })

    return deletedFeedback;
  }

  async getFeedbacksByUser(userId: string, options?: {
    limit?: number;
    skip?: number;
  }) {
    // This would require a new adapter method, but keeping it simple for now
    // Could be implemented later if needed
    throw new HttpError({
      statusCode: 501,
      message: "Get feedbacks by user not implemented yet",
      code: "NOT_IMPLEMENTED",
      meta: { source: "FeedbackService.getFeedbacksByUser" },
      errors: [],
    });
  }
}

export default new FeedbackService();