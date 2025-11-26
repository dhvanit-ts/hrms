import { env } from "@/config/env";
import { UserTable } from "@/infra/db/tables/user.table";
import { drizzle } from "drizzle-orm/node-postgres";
import { RefreshTokenTable } from "./tables/refresh-token.table";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    users: UserTable,
    refreshTokens: RefreshTokenTable,
  },
});

export default db;
