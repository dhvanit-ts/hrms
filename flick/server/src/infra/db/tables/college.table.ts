import { pgTable, uuid, index, timestamp, text } from "drizzle-orm/pg-core";

export const colleges = pgTable("college", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text('name').notNull(),
  emailDomain: text('emailDomain').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  profile: text('profile').notNull().default('https://yourcdn.com/default-college-profile.png'),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
},
  (table) => [
    index('idx_college_name').on(table.name),
    index('idx_college_city_state').on(table.city, table.state),
  ]
);
