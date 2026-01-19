// audit-context.ts
import { Role } from "@/config/roles";
import { AuditAction } from "@/shared/constants/audit/actions";
import { AuditEntity } from "@/shared/constants/audit/entity";
import { AsyncLocalStorage } from "node:async_hooks";

export type AuditEntry = {
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type ObservabilityContext = {
  requestId: string;
  userId?: string;
  roles?: Role[];
  ip?: string;
  userAgent?: string;
  platform?: string;
  auditBuffer: AuditEntry[];
};

export const observabilityContext =
  new AsyncLocalStorage<ObservabilityContext>();
