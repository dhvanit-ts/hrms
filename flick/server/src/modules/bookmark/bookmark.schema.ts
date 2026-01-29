import { z } from "zod";

export const PostIdSchema = z.object({
  postId: z.string("Post ID is required"),
});
