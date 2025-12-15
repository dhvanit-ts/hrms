import { Response } from "express";
import { AuthenticatedRequest } from "@/core/middlewares/auth/jwt.middleware.js";
import ApiResponse from "@/core/http/ApiResponse.js";
import { AsyncHandler } from "@/core/http/asyncHandler.js";
import bookmarkService from "./bookmark.service";

class BookmarkController {

  @AsyncHandler()
  async createBookmark(req: AuthenticatedRequest) {
    const { postId } = req.body;
    const userId = req.user.id;

    const newBookmark = await bookmarkService.createBookmark(userId, postId);

    return ApiResponse.created({
      bookmark: newBookmark,
    });
  };

  @AsyncHandler()
  async getUserBookmarkedPosts(req: AuthenticatedRequest) {
    const userId = req.user.id;

    const posts = await bookmarkService.getUserBookmarkedPosts(userId);

    return ApiResponse.ok({
      posts,
      count: posts.length,
    });
  };

  @AsyncHandler()
  async deleteBookmark(req: AuthenticatedRequest) {
    const { postId } = req.params;
    const userId = req.user.id;

    await bookmarkService.deleteBookmark(userId, postId);
    return ApiResponse.ok({ message: "Bookmark deleted" });
  };

  @AsyncHandler()
  async getBookmark(req: AuthenticatedRequest) {
    const { postId } = req.params;
    const userId = req.user.id;

    const bookmark = await bookmarkService.getBookmark(userId, postId);
    return ApiResponse.ok({ bookmark });
  };

}

export default new BookmarkController();