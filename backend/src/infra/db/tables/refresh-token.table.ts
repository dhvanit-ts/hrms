import { UserTable } from "@/infra/db/tables/user.table";
import {
  pgTable,
  index,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const RefreshTokenTable = pgTable(
  "refreshToken",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => UserTable.id),
    jti: text("jti").unique().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    tokenHash: text("tokenHash").notNull(),
    revokedAt: timestamp("revokedAt"),
    replacedBy: uuid("replacedBy").references(() => RefreshTokenTable.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("refreshTokenJtiIndex").on(table.jti),
    index("refreshTokenUserIdIndex").on(table.userId),
    index("refreshTokenExpiredAtIndex").on(table.expiresAt),
  ]
);
