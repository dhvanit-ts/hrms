import { z } from "zod";

const topicEnum = [
  "Ask Flick",
  "Serious Discussion",
  "Career Advice",
  "Showcase",
  "Off-topic",
  "Community Event",
  "Rant / Vent",
  "Help / Support",
  "Feedback / Suggestion",
  "News / Update",
  "Guide / Resource",
] as const;

export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long"),
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
  topic: z.enum(topicEnum).refine((val) => topicEnum.includes(val), {
    message: "Invalid topic selected",
  }),
});

export const UpdatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long").optional(),
  content: z.string().min(1, "Content is required").max(10000, "Content too long").optional(),
  topic: z.enum(topicEnum).refine((val) => topicEnum.includes(val), {
    message: "Invalid topic selected",
  }).optional(),
});

export const PostIdSchema = z.object({
  id: z.uuid("Invalid post ID format"),
});

export const GetPostsQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)).optional(),
  limit: z.string().transform(val => Math.max(1, Math.min(50, parseInt(val) || 10))).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "views"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  topic: z.enum(topicEnum).optional(),
  collegeId: z.uuid("Invalid college ID").optional(),
  branch: z.string().optional(),
});

export const CollegeIdSchema = z.object({
  collegeId: z.uuid("Invalid college ID format"),
});

export const BranchSchema = z.object({
  branch: z.string().min(1, "Branch is required"),
});
