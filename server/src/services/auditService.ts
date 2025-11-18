import prisma from "@/config/db.js";
import { Prisma } from "@prisma/client";

export async function writeAuditLog(params: {
  action: string;
  entity: string;
  entityId: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      performedBy: params.performedBy || null,
      metadata: (params.metadata || {}) as Prisma.JsonValue,
    },
  });
}
