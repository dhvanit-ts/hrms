import { env } from "@/config/env";
import { UserTable } from "@/modules/user/user.table";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    users: UserTable,
  },
});

export default db;
