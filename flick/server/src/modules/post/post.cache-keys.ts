const postCacheKeys = {
  id: (id: string) => `post:id:${id}`,
  idWithDetails: (id: string, userId?: string) => `post:details:${id}:${userId || 'anonymous'}`,
  many: (page: number, limit: number, sortBy: string, sortOrder: string, topic?: string, collegeId?: string, branch?: string, userId?: string) =>
    `post:many:${page}:${limit}:${sortBy}:${sortOrder}:${topic || 'all'}:${collegeId || 'all'}:${branch || 'all'}:${userId || 'anonymous'}`,
  count: (topic?: string, collegeId?: string, branch?: string) =>
    `post:count:${topic || 'all'}:${collegeId || 'all'}:${branch || 'all'}`,
};

export default postCacheKeys