import { Router } from "express";
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  getUserBookmarkedPosts,
} from "../controllers/bookmark.controller.js";
import {
  blockSuspensionMiddleware,
  verifyUserJWT,
} from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyUserJWT, createBookmark)
  .get(verifyUserJWT, getBookmark);
router.route("/user").get(verifyUserJWT, getUserBookmarkedPosts);
router.route("/delete/:postId").delete(verifyUserJWT, deleteBookmark);

export default router;
