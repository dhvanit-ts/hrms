import { Router } from "express";
import postController from "./post.controller";
import { authenticate } from "@/core/middlewares";

const router = Router();

// Create post (authenticated users)
router.route("/").post(authenticate, postController.createPost);

// Get all posts with filtering
router.route("/").get(postController.getPosts);

// Get single post by ID
router.route("/:id").get(postController.getPostById);

// Update post (author only)
router.route("/:id").patch(authenticate, postController.updatePost);

// Delete post (author only)
router.route("/:id").delete(authenticate, postController.deletePost);

// Increment post views
router.route("/:id/view").post(postController.incrementPostViews);

// Get posts by college
router.route("/college/:collegeId").get(postController.getPostsByCollege);

// Get posts by branch
router.route("/branch/:branch").get(postController.getPostsByBranch);

export default router;