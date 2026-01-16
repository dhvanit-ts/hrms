const voteCacheKeys = {
  userIdAndTarget: (id: string, target: string) => `vote:user:${id}:target:${target}`
};

export default voteCacheKeys