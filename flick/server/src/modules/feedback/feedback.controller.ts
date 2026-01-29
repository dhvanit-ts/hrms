import { Request } from "express";
import { Controller, HttpResponse } from "@/core/http";
import feedbackService from "./feedback.service";
import * as feedbackSchemas from "./feedback.schema";

@Controller()
class FeedbackController {
  static async createFeedback(req: Request) {
    const { title, content, type } = feedbackSchemas.CreateFeedbackSchema.parse(req.body);
    const userId = req.user.id;

    const newFeedback = await feedbackService.createFeedback({
      title,
      content,
      type,
      userId,
    });

    return HttpResponse.created("Feedback created successfully", { feedback: newFeedback });
  }

  static async getFeedbackById(req: Request) {
    const { id } = feedbackSchemas.FeedbackIdSchema.parse(req.params);

    const feedback = await feedbackService.getFeedbackById(id, true);

    return HttpResponse.ok("Feedback retrieved successfully", { feedback });
  }

  static async listFeedbacks(req: Request) {
    const { limit, skip, type, status } = feedbackSchemas.ListFeedbacksQuerySchema.parse(req.query)

    const result = await feedbackService.listFeedbacks({
      limit,
      skip,
      type,
      status,
    });

    return HttpResponse.ok("Feedbacks retrieved successfully", result);
  }

  static async updateFeedbackStatus(req: Request) {
    const { id } = feedbackSchemas.FeedbackIdSchema.parse(req.params);
    const { status } = feedbackSchemas.UpdateFeedbackStatusSchema.parse(req.body);

    const updatedFeedback = await feedbackService.updateFeedbackStatus(id, status);

    return HttpResponse.ok("Feedback status updated successfully", { feedback: updatedFeedback });
  }

  static async deleteFeedback(req: Request) {
    const { id } = feedbackSchemas.FeedbackIdSchema.parse(req.params);

    await feedbackService.deleteFeedback(id);

    return HttpResponse.ok("Feedback deleted successfully");
  }
}

export default FeedbackController;
