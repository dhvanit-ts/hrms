import { CacheProvider } from "./cache.interface";
import { NodeCacheProvider } from "./providers/node-cache.provider";
import { RedisCacheProvider } from "./providers/redis.provider";
import { MultiTierCacheProvider } from "./providers/multi-tier.provider";
import { env } from "@/config/env";

export function createCacheProvider(): CacheProvider {
  const driver = env.CACHE_DRIVER ?? "memory";
  const ttl = Number(env.CACHE_TTL ?? 3600);

  switch (driver) {
    case "redis":
      return new RedisCacheProvider(env.REDIS_URL);

    case "multi":
      const l1 = new NodeCacheProvider(ttl);
      const l2 = new RedisCacheProvider(env.REDIS_URL);
      return new MultiTierCacheProvider(l1, l2, ttl);

    case "memory":
      return new NodeCacheProvider(ttl);
    default:
      return new NodeCacheProvider(ttl);
  }
}
