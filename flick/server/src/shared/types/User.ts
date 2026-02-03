import { users } from "@/infra/db/tables/user.table";

export type UserInsert = typeof users.$inferInsert
export type UserSelect = typeof users.$inferSelect
