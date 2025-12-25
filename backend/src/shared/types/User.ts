import { Role } from "@/config/roles";
export interface User {
  id: string;
  username: string;
  email: string;
  password: string | null;
  authType: "manual" | "oauth";
  refreshToken?: string | null;
  roles: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}
