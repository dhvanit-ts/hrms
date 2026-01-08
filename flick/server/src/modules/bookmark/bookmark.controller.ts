import { AsyncHandler, HttpResponse } from "@/core/http";
import bookmarkService from "./bookmark.service";
import { Request } from "express";
import { withBodyValidation, withParamsValidation } from "@/lib/validation";
import * as bookmarkSchemas from "./bookmark.schema";

class BookmarkController {
  static createBookmark = withBodyValidation(bookmarkSchemas.postIdSchema, this.createBookmarkHandler)

  @AsyncHandler()
  private static async createBookmarkHandler(req: Request) {
    const { postId } = req.body;
    const userId = req.user.id;

    const newBookmark = await bookmarkService.createBookmark(userId, postId);

    return HttpResponse.created("Bookmark created successfully", {
      bookmark: newBookmark,
    });
  };

  @AsyncHandler()
  static async getUserBookmarkedPosts(req: Request) {
    const userId = req.user.id;

    const posts = await bookmarkService.getUserBookmarkedPosts(userId);

    return HttpResponse.ok("User bookmarked posts retrieved successfully", {
      posts,
      count: posts.length,
    });
  };

  static deleteBookmark = withParamsValidation(bookmarkSchemas.postIdSchema, this.deleteBookmarkHandler)

  @AsyncHandler()
  private static async deleteBookmarkHandler(req: Request) {
    const { postId } = req.params;
    const userId = req.user.id;

    await bookmarkService.deleteBookmark(userId, postId);
    return HttpResponse.ok("Bookmark deleted successfully");
  };

  static getBookmark = withParamsValidation(bookmarkSchemas.postIdSchema, this.getBookmarkHandler)

  @AsyncHandler()
  private static async getBookmarkHandler(req: Request) {
    const { postId } = req.params;
    const userId = req.user.id;

    const bookmark = await bookmarkService.getBookmark(userId, postId);
    return HttpResponse.ok("Bookmark retrieved successfully", { bookmark });
  };
}

export default BookmarkController;