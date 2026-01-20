import { HttpError } from "@/core/http";
import BookmarkRepo from "./bookmark.repo";
import logger from "@/core/logger";

class BookmarkService {
  async createBookmark(userId: string, postId: string) {
    logger.info("Creating bookmark", { userId, postId });
    
    const existing = await BookmarkRepo.CachedRead.findBookmark(userId, postId);
    if (existing) {
      logger.warn("Bookmark already exists", { userId, postId });
      throw new HttpError({
        statusCode: 409,
        message: "Bookmark already exists",
        code: "BOOKMARK_ALREADY_EXISTS",
        meta: { source: "BookmarkService.createBookmark" },
        errors: [
          {
            field: "postId",
            message: "Bookmark already exists",
          },
        ],
      });
    }

    const newBookmark = await BookmarkRepo.Write.createBookmark({ userId, postId });
    logger.info("Bookmark created successfully", { userId, postId, bookmarkId: newBookmark.id });
    return newBookmark;
  }

  async getUserBookmarkedPosts(userId: string) {
    logger.info("Fetching user bookmarked posts", { userId });
    
    const bookmarks = await BookmarkRepo.CachedRead.getUserBookmarkedPosts(userId);
    logger.info("Retrieved user bookmarked posts", { userId, count: bookmarks.length });
    return bookmarks;
  }

  async deleteBookmark(userId: string, postId: string) {
    logger.info("Deleting bookmark", { userId, postId });
    
    const deleted = await BookmarkRepo.Write.deleteBookmark(userId, postId);
    if (!deleted) {
      logger.warn("Bookmark not found for deletion", { userId, postId });
      throw HttpError.notFound("Bookmark not found for this user",
        {
          code: "BOOKMARK_NOT_FOUND",
          meta: { source: "BookmarkService.deleteBookmark" },
          errors: [{ field: "postId", message: "Bookmark not found for this user" }],
        });
    }
    
    logger.info("Bookmark deleted successfully", { userId, postId });
    return deleted;
  }

  async getBookmark(userId: string, postId: string) {
    logger.info("Fetching bookmark", { userId, postId });
    
    const bookmark = await BookmarkRepo.CachedRead.findBookmarkWithPost(userId, postId);
    if (!bookmark) {
      logger.warn("Bookmark not found", { userId, postId });
      throw HttpError.notFound("Bookmark not found for this user",
        {
          code: "BOOKMARK_NOT_FOUND",
          meta: { source: "BookmarkService.getBookmark" },
          errors: [{ field: "postId", message: "Bookmark not found for this user" }],
        });
    }
    
    logger.info("Bookmark retrieved successfully", { userId, postId, bookmarkId: bookmark.id });
    return bookmark;
  }
}

export default new BookmarkService;