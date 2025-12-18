import Redis, { RedisOptions } from "ioredis";
import { CacheProvider } from "../cache.interface";

export class RedisCacheProvider implements CacheProvider {
  private client: Redis;

  constructor(url: string, options?: RedisOptions) {
    this.client = new Redis(url, {
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
      ...options,
    });

    this.client.on("error", (err) => {
      console.error("[Redis] Error:", err);
    });
  }

  async get<_T>(key: string) {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set<T>(key: string, value: T, ttl?: number) {
    const str = JSON.stringify(value);

    if (ttl) {
      return (await this.client.set(key, str, "EX", ttl)) === "OK";
    } else {
      return (await this.client.set(key, str)) === "OK";
    }
  }

  async del(key: string) {
    return (await this.client.del(key)) > 0;
  }

  async flush() {
    await this.client.flushall();
  }

  async keys() {
    return this.client.keys("*");
  }

  async has(key: string) {
    return (await this.client.exists(key)) === 1;
  }
}
