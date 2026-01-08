import { defineConfig } from 'drizzle-kit';
import { env } from "./src/config/env"

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/db/tables/user.table.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true
})
