import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.table";

export const roleEnum = pgEnum("log_role", ["Admin", "User"]);

export const platformEnum = pgEnum("log_platform", [
  "web",
  "mobile",
  "tv",
  "server",
  "other",
]);

export const statusEnum = pgEnum("log_status", ["success", "fail"]);

export const actionEnum = pgEnum("log_action", [
  "user:upvoted:post",
  "user:upvoted:comment",
  "user:downvoted:post",
  "user:downvoted:comment",
  "user:deleted:vote:on:comment",
  "user:deleted:vote:on:post",
  "user:switched:vote:on:comment",
  "user:switched:vote:on:post",
  "user:created:post",
  "user:updated:post",
  "user:created:comment",
  "user:updated:comment",
  "user:deleted:post",
  "user:deleted:comment",
  "user:reported:content",
  "user:accepted:terms",
  "user:initialized:account",
  "user:created:account",
  "user:verified:otp",
  "user:failed:to:verify:otp",
  "user:reset:email:otp",
  "user:logged:in:self",
  "user:logged:out:self",
  "user:created:feedback",
  "user:updated:feedback",
  "user:deleted:feedback",
  "user:forgot:password",
  "user:initialized:forgot:password",

  "admin:banned:user",
  "admin:unbanned:user",
  "admin:suspended:user",
  "admin:created:college",
  "admin:deleted:college",
  "admin:updated:college",
  "admin:blocked:content",
  "admin:unblocked:content",
  "admin:shadow:banned:content",
  "admin:shadow:unbanned:content",
  "admin:updated:content",
  "admin:deleted:report",
  "admin:bulk:deleted:reports",
  "admin:updated:report:status",
  "admin:updated:feedback:status",
  "admin:deleted:feedback",

  "system:created:admin:account",
  "admin:logged:out:self",
  "admin:initialized:account",
  "admin:verified:otp",
  "admin:removed:authorized:device",
  "admin:reset:email:otp",
  "admin:deleted:admin:account",
  "admin:updated:admin:account",
  "admin:fetched:all:admin:accounts",

  "system:logged:error",
  "system:logged:in",
  "system:logged:out",

  "other:action",
]);

export const auditLogs = pgTable(
  "logs",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    role: roleEnum("role").notNull(),
    userId: uuid("userId").notNull().references(() => users.id),
    logVersion: integer("logVersion").default(1).notNull(),
    action: actionEnum("action").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    sessionId: text("sessionId"),
    platform: platformEnum("platform").notNull(),
    status: statusEnum("status").default("success").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("log_user_id_idx").on(table.userId),
    index("log_timestamp_idx").on(table.timestamp),
  ]
);
