import { Request } from "express"; // Assuming Express.js
import { LogModel } from "../models/log.model.js";
import { TLogAction } from "../types/Log.js";
import { toObjectId } from "../utils/toObject.js";
import { Types } from "mongoose";

interface LogEventOptions {
  req?: Request;
  userId: string | null;
  action: TLogAction;
  status?: "success" | "fail";
  platform: "web" | "mobile" | "tv" | "other";
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export async function logEvent(options: LogEventOptions) {
  try {
    const {
      req,
      userId,
      action,
      status = "success",
      platform,
      sessionId = "unknown",
      metadata = {},
      timestamp = new Date(),
    } = options;

    let extractedMetadata = { ...metadata };

    if (req) {
      const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

      const userAgent = req.headers["user-agent"] || "unknown";

      extractedMetadata = {
        ...extractedMetadata,
        ipAddress: ip,
        deviceInfo: parseUserAgent(userAgent),
      };
    }

    const role = req?.admin ? "Admin" : req?.user ? "User" : null;

    let logData: {
      role?: string;
      action: TLogAction;
      status: "success" | "fail";
      platform: "web" | "mobile" | "tv" | "other";
      sessionId: string;
      metadata: {
        [x: string]: any;
      };
      userId?: Types.ObjectId;
      timestamp: Date;
    } = {
      action,
      status,
      platform,
      sessionId,
      metadata: extractedMetadata,
      timestamp,
    };

    if (userId) {
      logData.userId = toObjectId(userId);
    }

    if(role){
      logData.role = role
    }

    await LogModel.create(logData);
  } catch (err) {
    console.error("Failed to log event internally:", err);
  }
}

function parseUserAgent(userAgent: string) {
  return {
    raw: userAgent,
    browser: guessBrowser(userAgent),
    os: guessOS(userAgent),
    deviceType: guessDeviceType(userAgent),
  };
}

function guessBrowser(ua: string) {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
}

function guessOS(ua: string) {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "MacOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone")) return "iOS";
  return "Unknown";
}

function guessDeviceType(ua: string) {
  if (/Mobi|Android/i.test(ua)) return "mobile";
  return "desktop";
}
