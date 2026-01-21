import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";
import redisClient from "../services/redis.service.js";

const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 20, // 20 requests
  duration: 60,
});

const rateLimitMiddleware = (limiter: RateLimiterRedis) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.ip) return next();
      await limiter.consume(req.ip);
      next();
    } catch (err) {
      const rejRes = err as RateLimiterRes
      res.set("Retry-After", String(Math.ceil(rejRes.msBeforeNext / 1000)));
      res
        .status(429)
        .json({ message: "Too Many Requests. Please try again later." });
    }
  };
};

export { apiLimiter, authLimiter, rateLimitMiddleware };
