import { Request, Response, NextFunction } from "express";
import { IRateLimiter } from "./rl.interface";
import { RateLimiterRes } from "rate-limiter-flexible";

export const createRateLimiterMiddleware = (limiter: IRateLimiter) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip;

      await limiter.consume(key);
      const info = await limiter.get(key);

      if (info) {
        res.set("X-RateLimit-Limit", String(limiter.limit));
        res.set("X-RateLimit-Remaining", String(info.remaining));
        res.set("X-RateLimit-Reset", String(info.resetAt));
      }

      next();
    } catch (err: unknown) {
      const rejRes = err as RateLimiterRes;
      res.set("Retry-After", String(Math.ceil(rejRes.msBeforeNext / 1000)));
      res.status(429).json({ message: "Too Many Requests" });
    }
  };
};
