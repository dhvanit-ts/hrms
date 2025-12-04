import { Role } from "@/config/roles";
import { Types } from "mongoose";

export interface User {
  _id?: string | Types.ObjectId;
  username: string;
  email: string;
  password: string;
  authType: "manual" | "oauth";
  refreshToken?: string;
  roles: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}
