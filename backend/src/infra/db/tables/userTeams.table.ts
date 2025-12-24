import { pgTable, uuid } from "drizzle-orm/pg-core";
import { teams } from "./team.table";
import { users } from "./user.table";

export const userTeams = pgTable("user_teams", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id),
  userId: uuid("user_id").notNull().references(() => users.id),
})