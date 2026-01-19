import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uuid,
  inet,
} from "drizzle-orm/pg-core";
import { auditActions } from "@/shared/constants/audit/actions";
import { auditPlatforms } from "@/shared/constants/audit/platform";
import { auditStatus } from "@/shared/constants/audit/status";
import { roleKeys } from "@/config/roles";
import { auditEntityTypes } from "@/shared/constants/audit/entity";

export const roleEnum = pgEnum("log_role", roleKeys);
export const platformEnum = pgEnum("log_platform", auditPlatforms);
export const statusEnum = pgEnum("log_status", auditStatus);
export const actionEnum = pgEnum("log_action", auditActions);
export const entityEnum = pgEnum("log_action", auditEntityTypes);

/**
 * id: uuid PRIMARY KEY DEFAULT get_random_uuid()
 * occurred_at: timestamptz NOT NULL DEFAULT now()
 * actor_id: uuid
 * actor_type: text NOT NULL - user, system, admin, service.
 * action: text NOT NULL - INSERT, UPDATE, DELETE, LOGIN, PASSWORD_RESET, STATUS_CHANGE
 * entity_type: text NOT NULL - order, user, invoice
 * entity_id: uuid
 * before: jsonb - only for update/delete. changes tracking
 * after: jsonb - only for update/insert. changes tracking
 * ip_address: inet
 * user_agent: text
 * request_id: uuid - should corelate to logs (system logs, logger.error() etc)
 * reason: text - optional free text explaining why
 * metadata: jsonb - you're doing this already
 */

/**
CREATE INDEX idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);

CREATE INDEX idx_audit_logs_actor
  ON audit_logs (actor_id);

CREATE INDEX idx_audit_logs_occurred_at
  ON audit_logs (occurred_at DESC);
 */

export const auditLogs = pgTable(
  "logs",
  {
    id: uuid().defaultRandom().primaryKey(),
    occuredAt: timestamp("occured_at", { withTimezone: true }).defaultNow().notNull(),

    actorId: uuid("actor_id"),
    actorType: roleEnum("actor_type").array().notNull(),

    // can be improved
    action: text().notNull(),

    entityType: entityEnum("entity_type").notNull(),
    entityId: uuid("entity_id"),

    before: jsonb(),
    after: jsonb(),

    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),

    requestId: uuid("request_id"),
    reason: text(),
    metadata: jsonb()
  },
  (table) => [
    index("idx_audit_logs_entity").on(table.entityType, table.entityId),
    index("idx_audit_logs_actor").on(table.actorId),
    index("idx_audit_logs_occurred_at").on(table.occuredAt.desc()),
  ]
);

export type AuditLogsInsert = typeof auditLogs.$inferInsert
export type AuditLogsSelect = typeof auditLogs.$inferSelect
