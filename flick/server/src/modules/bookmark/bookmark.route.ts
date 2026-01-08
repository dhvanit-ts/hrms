import { Router } from "express";
import bookmarkControllers from "./bookmark.controller";
import { authenticate, ensureRatelimit } from "@/core/middlewares";

const router = Router();

router.use(ensureRatelimit.api);
router.use(authenticate)

router.route("/:postId").get(bookmarkControllers.getBookmark);
router.route("/user").get(bookmarkControllers.getUserBookmarkedPosts);
router.route("/delete/:postId").delete(bookmarkControllers.deleteBookmark);

// mutable requests
router.route("/").post(bookmarkControllers.createBookmark)

export default router;