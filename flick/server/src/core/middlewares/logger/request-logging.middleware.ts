import logger from "@/core/logger";
import { Application, Request } from "express";
import morgan from "morgan";

const SKIP_SUFFIXES = ["/healthz", "/readyz"];

const morganStream = {
  write: (message: string) => {
    setImmediate(() => {
      logger.http(JSON.parse(message));
    });
  }
};

let morganRegistered = false;

export const registerRequestLogging = (app: Application) => {
  if (morganRegistered) return;
  morganRegistered = true;

  morgan.token("id", (req: Request) => req.id);
  morgan.token("remoteAddr", (req: Request) => req.ip);

  app.use(
    morgan(
      (tokens, req, res) =>
        JSON.stringify({
          requestId: tokens.id(req, res),
          ip: tokens.remoteAddr(req, res),
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number(tokens.status(req, res)),
          responseTimeMs: Number(tokens["response-time"](req, res))
        }),
      {
        stream: morganStream,
        skip: (req: Request) =>
          req.method === "HEAD" ||
          (req.path.startsWith("/api/") &&
            SKIP_SUFFIXES.some((suffix) => req.path.endsWith(suffix)))
      }
    )
  );
};
