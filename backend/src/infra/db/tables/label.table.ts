import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const labels = pgTable("label", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull()
})