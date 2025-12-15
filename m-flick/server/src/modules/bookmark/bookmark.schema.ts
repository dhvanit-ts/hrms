import { z } from "zod";

export const postIdSchema = z.object({
  postId: z.string("Post ID is required"),
});
