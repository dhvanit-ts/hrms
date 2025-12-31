import type { Application } from "express";
import cors, { type CorsOptions } from "cors";
import { env } from "./env";
import helmet from "helmet";

export const applySecurity = (app: Application) => {
  app.disable("x-powered-by");
  app.use(helmet());
  const corsOptions: CorsOptions = {
    origin: env.ACCESS_CONTROL_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
};

export default applySecurity;
