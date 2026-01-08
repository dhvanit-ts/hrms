const bookmarkCacheKeys = {
  id: (id: string) => `bookmark:id:${id}`,
  multiId: (...ids: string[]) => `bookmark:ids:${ids.join(",")}`,
};

export default bookmarkCacheKeys