import Redis from "ioredis";
import { CacheProvider } from "../cache.interface";

export class RedisCacheProvider  implements CacheProvider  {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      enableReadyCheck: true,
      maxRetriesPerRequest: null
    });

    this.client.on("error", (err) => {
      console.error("[Redis] Error:", err);
    });
  }

  async get<T>(key: string) {
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
}
