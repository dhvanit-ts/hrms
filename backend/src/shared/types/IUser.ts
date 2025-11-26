import { Role } from "@/config/roles";

export interface IUser {
  id?: string;
  username: string;
  email: string;
  password: string;
  authType: "manual" | "oauth";
  refreshToken?: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate
  extends Omit<IUser, "id" | "createdAt" | "updatedAt"> {}
