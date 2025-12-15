import { Role } from "@/config/roles";
export interface User {
  id?: string;
  username: string;
  email: string;
  password: string;
  authType: "manual" | "oauth";
  refreshToken?: string;
  roles: Role[];
  isBlocked: boolean;
  suspension: {
    reason: string | null;
    ends: Date | null;
    howManyTimes: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}
