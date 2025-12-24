import { pgTable, uuid } from "drizzle-orm/pg-core";
import { issues } from "./issue.table";
import { labels } from "./label.table";

export const issueLabels = pgTable("issue-labels", {
  id: uuid("id").primaryKey(),
  issueId: uuid("issueId").notNull().references(() => issues.id),
  labelId: uuid("leblId").notNull().references(() => labels.id)
})