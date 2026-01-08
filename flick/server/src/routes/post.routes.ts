import { Router } from "express";
import {
  createPost,
  deletePost,
  getPostById,
  getPostsByCollege,
  getPostsForFeed,
  IncrementView,
  updatePost,
  getPostsByFilter,
} from "../controllers/post.controller.js";
import { blockSuspensionMiddleware, lazyVerifyJWT, termsAcceptedMiddleware, verifyUserJWT } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(
    verifyUserJWT,
    blockSuspensionMiddleware,
    termsAcceptedMiddleware,
    createPost
  );
router.route("/delete/:postId").delete(verifyUserJWT, deletePost);
router.route("/view/:postId").post(IncrementView);
router.route("/get/single/:id").get(lazyVerifyJWT, getPostById);
router.route("/get/filter").get(lazyVerifyJWT, getPostsByFilter);
router.route("/feed").get(lazyVerifyJWT, getPostsForFeed);
router.route("/college/:collegeId").get(verifyUserJWT, getPostsByCollege);
router
  .route("/update/:postId")
  .patch(verifyUserJWT, blockSuspensionMiddleware, updatePost);

export default router;
