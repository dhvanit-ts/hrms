import logger from "@/core/logger";
import { Application, Request } from "express";
import morgan from "morgan"

const SKIP_SUFFIXES = ["/healthz", "/readyz"];

const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

export const registerRequestLogging = (app: Application) => {
  morgan.token('id', (req: Request) => req.id);

  app.use(morgan(
    ':id :method :url :status :response-time ms',
    {
      stream: morganStream,
      skip: (req) => SKIP_SUFFIXES.some((suffix) => req.path.endsWith(suffix))
    }
  ));
}
