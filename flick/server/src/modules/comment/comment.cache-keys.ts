const commentCacheKeys = {
  id: (id: string) => `comment:id:${id}`,
  postComments: (postId: string, page: number, limit: number, sortBy: string, sortOrder: string, userId?: string) =>
    `comment:post:${postId}:${page}:${limit}:${sortBy}:${sortOrder}:${userId || 'anonymous'}`,
  postCount: (postId: string) => `comment:count:post:${postId}`,
};

export default commentCacheKeys