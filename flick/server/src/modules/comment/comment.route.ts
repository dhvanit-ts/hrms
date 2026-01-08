import { Router } from "express";
import commentController from "./comment.controller";
import { authenticate, ensureRatelimit } from "@/core/middlewares";

const router = Router();

router.use(ensureRatelimit.api);

// Get comments by post ID
router.route("/post/:postId").get(commentController.getCommentsByPostId);

// Get single comment by ID
router.route("/:commentId").get(commentController.getCommentById);

// protected routes
router.use(authenticate)

// Create comment for a post
router.route("/post/:postId").post(commentController.createComment);

// Update comment
router.route("/:commentId").patch(commentController.updateComment);

// Delete comment
router.route("/:commentId").delete(commentController.deleteComment);

export default router;