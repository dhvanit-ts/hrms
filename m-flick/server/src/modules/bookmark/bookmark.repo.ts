import { BookmarkAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";

const keys = {
  id: (id: string) => `bookmark:id:${id}`,
  multiId: (...ids: string[]) => `bookmark:ids:${ids.join(",")}`,
};

export const findBookmark = (userId: string, postId: string, dbTx?: DB) =>
  cached(keys.multiId(userId, postId), () => BookmarkAdapter.findByUserAndPostId(userId, postId, dbTx))

export const findBookmarkWithPost = (userId: string, postId: string, dbTx?: DB) =>
  cached(keys.multiId(userId, postId), () => BookmarkAdapter.findByUserAndPostIdWithPost(userId, postId, dbTx));

export const getUserBookmarkedPosts = (userId: string, dbTx?: DB) =>
  cached(keys.id(userId), () => BookmarkAdapter.findBookmarkedPostsByUserId(userId, dbTx));

export const createBookmark = (userId: string, postId: string, dbTx?: DB) =>
  BookmarkAdapter.create({ userId, postId }, dbTx);

export const deleteBookmark = (userId: string, postId: string, dbTx?: DB) =>
  BookmarkAdapter.deleteBookmarkByUserAndPostId(userId, postId, dbTx);