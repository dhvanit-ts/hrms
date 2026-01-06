import winston from "winston";
import { env } from "@/config/env";
import { requestContextStore } from "./context";

const isDev = env.NODE_ENV === "development";

const addContext = winston.format((info) => {
  const store = requestContextStore.getStore();

  if (store) {
    info.request_id = store.get("request_id");
    info.ip = store.get("ip");
    info.user_agent = store.get("user_agent");
  }

  return info;
});

const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    addContext(),
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
  defaultMeta: {
    service: "auth"
  },
  transports: [new winston.transports.Console()],
});

export default logger;
