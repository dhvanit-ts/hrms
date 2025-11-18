import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .union([z.string().transform((v) => v === 'true'), z.boolean()])
    .default(false)
    .transform((v) => !!v),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SENTRY_DSN: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

export const loadEnv = (): Env => {
  // dotenv is loaded via server start command or container
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration', parsed.error.flatten());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
};


