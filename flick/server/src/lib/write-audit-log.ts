import AuditService from "@/modules/audit/audit.service";
import { LogEventOptions } from "@/modules/audit/audit.types";
import { device } from "./device";
import { Request } from "express";

const writeAuditLog = async (options: Omit<LogEventOptions, "roles" | "userId"> & { req: Request }) => {
  try {
    const {
      req,
      action,
      meta = {},
      status = "success",
      platform = "web",
      sessionId = "unknown",
      timestamp = new Date(),
    } = options;

    let extractedMetadata = { ...meta };

    if (req) {
      const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

      const userAgent = req.headers["user-agent"] || "unknown";

      extractedMetadata = {
        ...extractedMetadata,
        ipAddress: ip,
        deviceInfo: device.parseUserAgent(userAgent),
      };
    }

    const logData: LogEventOptions = {
      action,
      status,
      platform,
      sessionId,
      meta: extractedMetadata,
      timestamp,
      roles: req.user.roles,
      userId: req.user.id,
    };

    await AuditService.writeLog(logData);
  } catch (err) {
    console.error("Failed to log event internally:", err);
  }
}

export default writeAuditLog