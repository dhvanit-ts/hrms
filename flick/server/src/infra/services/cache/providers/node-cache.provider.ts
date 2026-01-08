import NodeCache from "node-cache";
import { CacheProvider } from "../cache.interface";

export class NodeCacheProvider implements CacheProvider {
  private cache: NodeCache;

  constructor(ttlSeconds?: number) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds ? ttlSeconds * 0.2 : 60,
    });
  }

  async get<T>(key: string) {
    return this.cache.get<T>(key) ?? null;
  }

  async set<T>(key: string, value: T, ttl?: number) {
    return this.cache.set(key, value, ttl);
  }

  async del(key: string) {
    return this.cache.del(key) > 0;
  }

  async flush() {
    this.cache.flushAll();
  }

  async keys() {
    return this.cache.keys();
  }

  async has(key: string) {
    return this.cache.has(key);
  }
}
