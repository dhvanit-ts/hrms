import { User } from "@/shared/types/User";
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
