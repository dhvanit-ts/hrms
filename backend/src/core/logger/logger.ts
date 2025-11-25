import winston from "winston";
import { env } from "@/config/env";

const isDev = env.NODE_ENV === "development";

const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isDev
      ? winston.format.colorize({ all: true })
      : winston.format.uncolorize(),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const { timestamp, level, message, stack } = info;
      return stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
