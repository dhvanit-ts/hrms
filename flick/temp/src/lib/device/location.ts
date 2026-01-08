import axios from "axios";
import { Request } from "express";

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
  } catch {
    return "Unknown Location";
  }
};
