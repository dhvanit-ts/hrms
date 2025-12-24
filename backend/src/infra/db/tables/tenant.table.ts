import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenant", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  domain: text("domain")
})