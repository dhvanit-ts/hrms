// src/types/express/index.d.ts

import { User } from "@/shared/types/User";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password">;
    }
  }
}