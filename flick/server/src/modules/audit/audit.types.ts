import { Role } from "@/config/roles";
import { AuditAction } from "@/shared/constants/audit/actions";
import { AuditPlatform } from "@/shared/constants/audit/platform";
import { AuditStatus } from "@/shared/constants/audit/status";

export interface LogEventOptions {
  userId: string | null;
  action: AuditAction;
  status?: AuditStatus;
  platform?: AuditPlatform;
  sessionId?: string;
  meta?: Record<string, any>;
  timestamp?: Date;
  roles: Role[]
}
