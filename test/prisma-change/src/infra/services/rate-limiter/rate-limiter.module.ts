import { createLimiter } from "./rate-limiter.factory";

export const limiters = {
  api: createLimiter("rl_api", 100, 5 * 60),
  auth: createLimiter("rl_auth", 20, 15 * 60),
};

export type LimiterType = keyof typeof limiters;
