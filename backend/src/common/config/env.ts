import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  HTTP_SECURE_OPTION: z.string(),
  ACCESS_CONTROL_ORIGIN: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  CACHE_DRIVER: z.enum(["memory", "multi", "redis"]),
  CACHE_TTL: z.coerce.number().default(60),
  ACCESS_TOKEN_TTL: z.string(),
  REFRESH_TOKEN_TTL: z.string(),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  MAILTRAP_HOST: z.string(),
  MAILTRAP_PORT: z.string(),
  MAILTRAP_USER: z.string(),
  MAILTRAP_PASS: z.string(),
  GMAIL_APP_USER: z.string(),
  GMAIL_APP_PASS: z.string(),
  SERVER_BASE_URI: z.string(),
});

export const env = envSchema.parse(process.env);
