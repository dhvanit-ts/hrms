import { Role } from "@/config/roles";
import { AuditAction } from "@/shared/constants/audit/actions";
import { AuditEntity } from "@/shared/constants/audit/entity";
import { AuditPlatform } from "@/shared/constants/audit/platform";
import { AuditStatus } from "@/shared/constants/audit/status";

export interface LogEventOptions {
  action: AuditAction;
  status?: AuditStatus;
  platform?: AuditPlatform;
  sessionId?: string;
  meta?: Record<string, any>;
  occuredAt?: Date;
  entityId: string
  entityType: AuditEntity
  requestId?: string
  before?: JSON,
  after?: JSON,
  roles: Role[]
  reason?: string
}
