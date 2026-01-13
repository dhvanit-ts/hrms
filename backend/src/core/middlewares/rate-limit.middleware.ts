import { limiters, createRateLimiterMiddleware as create } from "@/infra/services/rate-limiter";

const ensureRatelimit = {
  auth: create(limiters.auth),
  api: create(limiters.api),
}

export default ensureRatelimit;
