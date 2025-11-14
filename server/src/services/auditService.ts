import { AuditLog } from '../models/AuditLog.js';

export async function writeAuditLog(params: {
  action: string;
  entity: string;
  entityId: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}) {
  await AuditLog.create({
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    performedBy: params.performedBy,
    metadata: params.metadata
  });
}


