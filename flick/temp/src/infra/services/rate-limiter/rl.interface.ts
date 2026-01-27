export interface IRateLimiter {
  consume(key: string): Promise<void>;
  get(key: string): Promise<{ remaining: number; resetAt: number } | null>;
  limit: number;
}
