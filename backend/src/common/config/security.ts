import { Application } from "express";
import cors, { CorsOptions } from "cors";
import { env } from "./env";
import helmet from "helmet";

const applySecurity = (app: Application) => {
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

  // const authLimiter = rateLimit({
  //   windowMs: 60 * 1000,
  //   limit: 10,
  //   standardHeaders: "draft-7",
  //   legacyHeaders: false,
  //   message: "Too many requests, please try again later.",
  // });

  // app.use("/api/auth", authLimiter);
};

export default applySecurity;
