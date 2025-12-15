import prisma from "@/config/db.js";
import { Prisma } from "@prisma/client";

const normalizePerformedBy = (value: string | number): number => (typeof value === "string" ? parseInt(value) : value) || null

export async function writeAuditLog(params: {
  action: string;
  entity: string;
  entityId: string;
  performedBy?: number | string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      performedBy: normalizePerformedBy(params.performedBy),
      metadata: (params.metadata || {}) as Prisma.JsonValue,
    },
  });
}
