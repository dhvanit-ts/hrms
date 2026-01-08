const feedbackCacheKeys = {
  id: (id: string) => `feedback:id:${id}`,
  all: (limit: number, skip: number, type?: string, status?: string) =>
    `feedback:all:${limit}:${skip}:${type || 'all'}:${status || 'all'}`,
  count: (type?: string, status?: string) =>
    `feedback:count:${type || 'all'}:${status || 'all'}`,
};

export default feedbackCacheKeys