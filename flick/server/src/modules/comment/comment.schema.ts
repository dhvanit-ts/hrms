import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment content too long"),
  parentCommentId: z.string().uuid("Invalid parent comment ID").optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment content too long"),
});

export const commentIdSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID format"),
});

export const postIdSchema = z.object({
  postId: z.uuid("Invalid post ID format"),
});

export const getCommentsQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});