import { Role } from "@/config/roles";
export interface User {
  id?: string;
  username: string;
  email: string;
  password: string;
  authType: "manual" | "oauth";
  refreshToken?: string;
  roles: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}
