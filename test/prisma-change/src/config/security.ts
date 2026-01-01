import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { ensureRatelimit } from "@/core/middlewares";
import corsOptions from "./cors";

export const applySecurity = (app: Application) => {
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(ensureRatelimit.api)
};

export default applySecurity;
