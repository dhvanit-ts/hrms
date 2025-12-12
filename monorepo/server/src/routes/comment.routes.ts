import { Router } from "express";
import {
  getCommentsByPostId,
  createComment,
  deleteComment,
  updateComment,
} from "../controllers/comment.controller.js";
import {
  blockSuspensionMiddleware,
  lazyVerifyJWT,
  termsAcceptedMiddleware,
  verifyUserJWT,
} from "../middleware/auth.middleware.js";

const router = Router();

router.route("/p/:postId").get(lazyVerifyJWT, getCommentsByPostId);
router
  .route("/create/:postId")
  .post(
    verifyUserJWT,
    blockSuspensionMiddleware,
    termsAcceptedMiddleware,
    createComment
  );
router.route("/delete/:commentId").delete(verifyUserJWT, deleteComment);
router
  .route("/update/:commentId")
  .patch(verifyUserJWT, blockSuspensionMiddleware, updateComment);

export default router;
