import { Router } from "express";
import bookmarkControllers from "./bookmark.controller";
import {
  blockSuspensionMiddleware,
  verifyUserJWT,
} from "@/core/middlewares/auth";
import { validate } from "@/core/middlewares";
import * as bookmarkSchemas from "./bookmark.schema";

const router = Router();

router.route("/").post(verifyUserJWT, blockSuspensionMiddleware, validate(bookmarkSchemas.postIdSchema), bookmarkControllers.createBookmark)
router.route("/:postId").get(verifyUserJWT, validate(bookmarkSchemas.postIdSchema, "params"), bookmarkControllers.getBookmark);
router.route("/user").get(verifyUserJWT, bookmarkControllers.getUserBookmarkedPosts);
router.route("/delete/:postId").delete(verifyUserJWT, validate(bookmarkSchemas.postIdSchema, "params"), bookmarkControllers.deleteBookmark);

export default router;
