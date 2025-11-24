import { env } from "@/common/config/env";
import { UserTable } from "@/features/user/user.table";
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(env.DATABASE_URL, {
  schema: {
    users: UserTable,
  },
});

export default db;