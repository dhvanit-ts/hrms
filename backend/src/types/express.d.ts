import { Role } from "@/config/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: Role[];
      };
    }
  }
}
