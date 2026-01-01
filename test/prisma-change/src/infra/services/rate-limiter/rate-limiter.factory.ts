import { RateLimiterRedis } from "rate-limiter-flexible";
import cache from "@/infra/services/cache";
import { RateLimiter } from "./rate-limiter.interface";

export class RedisLimiter implements RateLimiter {
  constructor(private rl: RateLimiterRedis) { }

  async consume(key: string) {
    await this.rl.consume(key);
  }

  async get(key: string) {
    const info = await this.rl.get(key);
    if (!info) return null;

    return {
      remaining: info.remainingPoints,
      resetAt: Math.floor(Date.now() / 1000 + info.msBeforeNext / 1000),
    };
  }

  get limit() {
    return this.rl.points;
  }
}

export const createLimiter = (
  keyPrefix: string,
  points: number,
  blockDuration = 5 * 60,
  duration = 60
) =>
  new RedisLimiter(
    new RateLimiterRedis({
      storeClient: cache,
      keyPrefix,
      points,
      duration,
      blockDuration,
    })
  );
