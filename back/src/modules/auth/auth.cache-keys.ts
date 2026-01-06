import cache from "@/infra/services/cache";

export const UserCacheKeys = Object.freeze({
  id: (id: string) => `user:id:${id}`,
  email: (email: string) => `user:email:${email}`,
  username: (u: string) => `user:username:${u}`,
  search: (q: string, page = 0, limit = 0) =>
    `user:search:${q.trim().toLowerCase()}:${page}:${limit}`,
});

type UserCacheTarget = {
  id?: string;
  email?: string;
  username?: string;
};

export const invalidateUserCache = async ({
  id,
  email,
  username,
}: UserCacheTarget) => {
  const keys: string[] = [];

  if (id) keys.push(`user:id:${id}`);
  if (email) keys.push(`user:email:${email.toLowerCase()}`);
  if (username) keys.push(`user:username:${username}`);

  if (!keys.length) return;

  await cache.del(...keys)
};
