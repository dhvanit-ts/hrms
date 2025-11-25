import { createLimiter } from "./rl.module";

export const limiters = {
  api: createLimiter("rl_api", 100),
  auth: createLimiter("rl_auth", 20),
};

export type LimiterType = keyof typeof limiters;
