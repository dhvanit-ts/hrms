import { defineConfig } from 'drizzle-kit';
import { env } from "./src/config/env"

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/db/tables/*',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true
})
