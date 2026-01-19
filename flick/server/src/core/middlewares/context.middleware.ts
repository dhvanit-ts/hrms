import { observabilityContext } from "@/modules/audit/audit-context";
import AuditService from "@/modules/audit/audit.service";
import { NextFunction, Request, Response } from "express";

async function flushAuditBuffer() {
  const ctx = observabilityContext.getStore();
  if (!ctx || ctx.auditBuffer.length === 0) return;

  for (const entry of ctx.auditBuffer) {
    await AuditService.writeLog({
      action: entry.action,
      metadata: entry.metadata,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before,
      after: entry.after,
      reason: entry.reason,
      actorId: ctx.userId,
      actorType: ctx.roles,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      occuredAt: new Date(),
    });
  }
}

function observeRequest(req: Request, res: Response, next: NextFunction) {

  const reqIdArray = req.headers['x-request-id']
  const reqId = Array.isArray(reqIdArray) ? reqIdArray[0] : reqIdArray

  const ctx = {
    requestId: reqId ?? crypto.randomUUID(),
    userId: req.user?.id,
    roles: req.user?.roles,
    ip: req.headers["x-forwarded-for"]?.toString().split(",")[0]
      ?? req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    platform: "web",
    auditBuffer: [],
  };

  observabilityContext.run(ctx, () => {
    res.setHeader("x-request-id", ctx.requestId);

    res.on("finish", () => {
      flushAuditBuffer().catch(err => {
        console.error("Audit flush failed", err);
      });
    });

    next();
  });
}

export default observeRequest