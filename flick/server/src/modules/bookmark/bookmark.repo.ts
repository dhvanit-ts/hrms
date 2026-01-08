import { BookmarkAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";
import bookmarkCacheKeys from "./bookmark.cache-keys";

const BookmarkRepo = {
  Read: {
    findBookmark: (userId: string, postId: string, dbTx?: DB) => BookmarkAdapter.findByUserAndPostId(userId, postId, dbTx),

    findBookmarkWithPost: (userId: string, postId: string, dbTx?: DB) => BookmarkAdapter.findByUserAndPostIdWithPost(userId, postId, dbTx),

    getUserBookmarkedPosts: (userId: string, dbTx?: DB) => BookmarkAdapter.findBookmarkedPostsByUserId(userId, dbTx),
  },

  CachedRead: {
    findBookmark: (userId: string, postId: string, dbTx?: DB) =>
      cached(bookmarkCacheKeys.multiId(userId, postId), () => BookmarkAdapter.findByUserAndPostId(userId, postId, dbTx)),

    findBookmarkWithPost: (userId: string, postId: string, dbTx?: DB) =>
      cached(bookmarkCacheKeys.multiId(userId, postId), () => BookmarkAdapter.findByUserAndPostIdWithPost(userId, postId, dbTx)),

    getUserBookmarkedPosts: (userId: string, dbTx?: DB) =>
      cached(bookmarkCacheKeys.id(userId), () => BookmarkAdapter.findBookmarkedPostsByUserId(userId, dbTx)),
  },

  Write: {
    createBookmark: BookmarkAdapter.create,
    deleteBookmark: BookmarkAdapter.deleteBookmarkByUserAndPostId
  }
}

export default BookmarkRepo