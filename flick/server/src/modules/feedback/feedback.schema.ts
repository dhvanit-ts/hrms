import { z } from "zod";

export const createFeedbackSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  type: z.enum(["feedback", "bug", "feature", "other"]).default("feedback"),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(["new", "reviewed", "dismissed"], {
    error: () => ({ message: "Status must be one of: new, reviewed, dismissed" }),
  }),
});

export const feedbackIdSchema = z.object({
  id: z.uuid("Invalid feedback ID format"),
});

export const listFeedbacksQuerySchema = z.object({
  limit: z.string().transform(val => Math.max(1, Math.min(100, parseInt(val) || 50))).optional(),
  skip: z.string().transform(val => Math.max(0, parseInt(val) || 0)).optional(),
  type: z.enum(["feedback", "bug", "feature", "other"]).optional(),
  status: z.enum(["new", "reviewed", "dismissed"]).optional(),
});