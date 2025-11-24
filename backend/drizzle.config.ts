import { defineConfig } from 'drizzle-kit';
import { env } from "./src/common/config/env"

export default defineConfig({
  out: './drizzle',
  schema: './src/common/config/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true
})
