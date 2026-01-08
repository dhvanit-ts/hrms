import { Router } from "express";
import feedbackController from "./feedback.controller";
import { ensureRatelimit, authenticate } from "@/core/middlewares";
import { adminOnly } from "@/core/middlewares/pipelines";

const router = Router();

router.use(ensureRatelimit.api);

// Create feedback (authenticated users)
router.route("/").post(authenticate, feedbackController.createFeedback);

// List all feedbacks (admin only)
router.route("/").get(adminOnly, feedbackController.listFeedbacks);

// Get single feedback by ID (admin only)
router.route("/:id").get(adminOnly, feedbackController.getFeedbackById);

// Update feedback status (admin only)
router.route("/:id/status").patch(adminOnly, feedbackController.updateFeedbackStatus);

// Delete feedback (admin only)
router.route("/:id").delete(adminOnly, feedbackController.deleteFeedback);

export default router;