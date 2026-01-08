import { Request } from "express";
import { AsyncHandler, HttpResponse } from "@/core/http";
import feedbackService from "./feedback.service";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";
import * as feedbackSchemas from "./feedback.schema";
import { validateRequest } from "@/core/middlewares";

class FeedbackController {
  static createFeedback = withBodyValidation(feedbackSchemas.createFeedbackSchema, this.createFeedbackHandler)

  @AsyncHandler()
  private static async createFeedbackHandler(req: Request) {
    const { title, content, type } = req.body;
    const userId = req.user.id;

    const newFeedback = await feedbackService.createFeedback({
      title,
      content,
      type,
      userId,
    });

    return HttpResponse.created("Feedback created successfully", { feedback: newFeedback });
  }

  static getFeedbackById = withParamsValidation(feedbackSchemas.feedbackIdSchema, this.getFeedbackByIdHandler)

  @AsyncHandler()
  private static async getFeedbackByIdHandler(req: Request) {
    const { id } = req.params;

    const feedback = await feedbackService.getFeedbackById(id, true);

    return HttpResponse.ok("Feedback retrieved successfully", { feedback });
  }

  static listFeedbacks = withQueryValidation(feedbackSchemas.listFeedbacksQuerySchema, this.listFeedbacksHandler)

  @AsyncHandler()
  private static async listFeedbacksHandler(req: Request) {
    const { limit, skip, type, status } = req.query as {
      limit?: number;
      skip?: number;
      type?: "feedback" | "bug" | "feature" | "other";
      status?: "new" | "reviewed" | "dismissed";
    };

    const result = await feedbackService.listFeedbacks({
      limit,
      skip,
      type,
      status,
    });

    return HttpResponse.ok("Feedbacks retrieved successfully", result);
  }

  static updateFeedbackStatus = [
    validateRequest(feedbackSchemas.feedbackIdSchema, "params"),
    validateRequest(feedbackSchemas.updateFeedbackStatusSchema),
    this.updateFeedbackStatusHandler
  ]

  @AsyncHandler()
  private static async updateFeedbackStatusHandler(req: Request) {
    const { id } = req.params;
    const { status } = req.body;

    const updatedFeedback = await feedbackService.updateFeedbackStatus(id, status);

    return HttpResponse.ok("Feedback status updated successfully", { feedback: updatedFeedback });
  }

  static deleteFeedback = withParamsValidation(feedbackSchemas.feedbackIdSchema, this.deleteFeedbackHandler)

  @AsyncHandler()
  private static async deleteFeedbackHandler(req: Request) {
    const { id } = req.params;

    await feedbackService.deleteFeedback(id);

    return HttpResponse.ok("Feedback deleted successfully");
  }
}

export default FeedbackController;
