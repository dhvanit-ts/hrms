const authCacheKeys = {
  id: (id: string) => `user:id:${id}`,
  email: (email: string) => `user:email:${email}`,
  username: (u: string) => `user:username:${u}`,
  search: (q: string) => `user:search:${q}`,
};

export default authCacheKeys