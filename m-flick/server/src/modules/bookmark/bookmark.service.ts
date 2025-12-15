import { ApiError } from "@/core/http";
import * as bookmarkRepo from "./bookmark.repo";

class BookmarkService {
  async createBookmark(userId: string, postId: string) {
    const existing = await bookmarkRepo.findBookmark(userId, postId);
    if (existing) throw new ApiError({
      statusCode: 409,
      message: "Bookmark already exists",
      code: "BOOKMARK_ALREADY_EXISTS",
      data: { service: "BookmarkService.createBookmark" },
      errors: [
        {
          field: "postId",
          message: "Bookmark already exists",
        },
      ],
    });

    const newBookmark = await bookmarkRepo.createBookmark(userId, postId);
    return newBookmark;
  }

  async getUserBookmarkedPosts(userId: string) {
    const bookmarks = await bookmarkRepo.getUserBookmarkedPosts(userId);
    return bookmarks;
  }

  async deleteBookmark(userId: string, postId: string) {
    const deleted = await bookmarkRepo.deleteBookmark(userId, postId);
    if (!deleted) throw new ApiError({
      statusCode: 404,
      message: "Bookmark not found for this user",
      code: "BOOKMARK_NOT_FOUND",
      data: { service: "BookmarkService.deleteBookmark" },
      errors: [{ field: "postId", message: "Bookmark not found for this user" }],
    });
    return deleted;
  }

  async getBookmark(userId: string, postId: string) {
    const bookmark = await bookmarkRepo.findBookmarkWithPost(userId, postId);
    if (!bookmark) throw new ApiError({
      statusCode: 404,
      message: "Bookmark not found for this user",
      code: "BOOKMARK_NOT_FOUND",
      data: { service: "BookmarkService.getBookmark" },
      errors: [{ field: "postId", message: "Bookmark not found for this user" }],
    });
    return bookmark;
  }
}

export default new BookmarkService;