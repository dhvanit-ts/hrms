import { HttpError } from "@/core/http";
import BookmarkRepo from "./bookmark.repo";

class BookmarkService {
  async createBookmark(userId: string, postId: string) {
    const existing = await BookmarkRepo.CachedRead.findBookmark(userId, postId);
    if (existing) throw new HttpError({
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

    const newBookmark = await BookmarkRepo.Write.createBookmark({ userId, postId });
    return newBookmark;
  }

  async getUserBookmarkedPosts(userId: string) {
    const bookmarks = await BookmarkRepo.CachedRead.getUserBookmarkedPosts(userId);
    return bookmarks;
  }

  async deleteBookmark(userId: string, postId: string) {
    const deleted = await BookmarkRepo.Write.deleteBookmark(userId, postId);
    if (!deleted) throw HttpError.notFound("Bookmark not found for this user",
      {
        code: "BOOKMARK_NOT_FOUND",
        meta: { source: "BookmarkService.deleteBookmark" },
        errors: [{ field: "postId", message: "Bookmark not found for this user" }],
      });
    return deleted;
  }

  async getBookmark(userId: string, postId: string) {
    const bookmark = await BookmarkRepo.CachedRead.findBookmarkWithPost(userId, postId);
    if (!bookmark) throw HttpError.notFound("Bookmark not found for this user",
      {
        code: "BOOKMARK_NOT_FOUND",
        meta: { source: "BookmarkService.getBookmark" },
        errors: [{ field: "postId", message: "Bookmark not found for this user" }],
      });
    return bookmark;
  }
}

export default new BookmarkService;