import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import corsOptions from "./cors";

export const applySecurity = (app: Application) => {
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(helmet());
  app.use(cors(corsOptions));
};

export default applySecurity;
