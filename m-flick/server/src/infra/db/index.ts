import { env } from "@/config/env";
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, bookmarks, auditLogs, notifications, posts, comments, feedbacks, colleges, votes } from "./tables";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    users,
    bookmarks,
    auditLogs,
    notifications,
    posts,
    comments,
    colleges,
    votes,
    feedbacks
  },
});

export default db;