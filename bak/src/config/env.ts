import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  HTTP_SECURE_OPTION: z.string(),
  ACCESS_CONTROL_ORIGIN: z.string(),
  
  
  CACHE_DRIVER: z.enum(["memory", "multi", "redis"]),
  CACHE_TTL: z.coerce.number().default(60),
  RESEND_API_KEY: z.string(),
  MAILTRAP_TOKEN: z.string(),
  MAIL_PROVIDER: z.enum(["gmail", "resend", "mailtrap"]),
  MAIL_FROM: z.string(),
  SERVER_BASE_URI: z.string()
});

export const env = envSchema.parse(process.env);