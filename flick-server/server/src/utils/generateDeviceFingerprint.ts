import { Request } from "express";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import axios from "axios";

async function generateDeviceFingerprint(req: Request) {
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const screenResolution = req.body.screenResolution || "";
  const hardwareConcurrency = req.body.hardwareConcurrency || "";
  const timezone = req.body.timezone || "";

  const rawFingerprint = `${userAgent}|${acceptLanguage}|${screenResolution}|${timezone}|${hardwareConcurrency}`;

  const fingerprintHash = crypto
    .createHash("sha256")
    .update(rawFingerprint)
    .digest("hex");

  return fingerprintHash;
}

export const getDeviceName = (userAgent: string): string => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";

  return `${os} - ${browser}`;
};

export const getLocationFromIP = async (req: Request): Promise<string> => {
  const ip =
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  if (!ip || ip.startsWith("::") || ip === "127.0.0.1") {
    return "Localhost (No location)";
  }

  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
    const { city, regionName, country } = data;
    return `${city || "Unknown"}, ${regionName || "Unknown"}, ${
      country || "Unknown"
    }`;
  } catch (err) {
    return "Unknown Location";
  }
};

export default generateDeviceFingerprint;
