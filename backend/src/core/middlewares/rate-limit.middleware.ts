import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";
import cache from "@/infra/services/cache";

const apiLimiter = new RateLimiterRedis({
  storeClient: cache,
  keyPrefix: "rl_api", // **Add prefix** to avoid key collisions
  points: 100,
  duration: 60,
  blockDuration: 60 * 5, // **Optional**: block further requests for 5 minutes after limit hit
});

const authLimiter = new RateLimiterRedis({
  storeClient: cache,
  keyPrefix: "rl_auth",
  points: 20,
  duration: 60,
  blockDuration: 60 * 15, // maybe stricter for auth routes
});

const limiterMap = {
  auth: authLimiter,
  api: apiLimiter,
};

const applyRateLimiter = (limiterType: "auth" | "api" = "api") => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = req.ip; // you might extend this (see below)
      await limiterMap[limiterType].consume(key);

      // Optionally set headers for remaining points
      const resInfo = await limiterMap[limiterType].get(key);
      if (resInfo) {
        res.set("X-RateLimit-Limit", String(limiterMap[limiterType].points));
        res.set(
          "X-RateLimit-Remaining",
          String(Math.max(resInfo.remainingPoints, 0))
        );
        res.set(
          "X-RateLimit-Reset",
          String(Math.ceil(resInfo.msBeforeNext / 1000 + Date.now() / 1000))
        );
      }
      next();
    } catch (err) {
      const rejRes = err as RateLimiterRes;
      // Provide “Retry-After” header
      res.set("Retry-After", String(Math.ceil(rejRes.msBeforeNext / 1000)));
      res
        .status(429)
        .json({ message: "Too Many Requests. Please try again later." });
    }
  };
};

export { applyRateLimiter };
