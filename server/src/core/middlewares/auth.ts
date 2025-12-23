import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "../../config/env.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; roles: string[] };
}

export interface EmployeeAuthenticatedRequest extends Request {
  employee?: { id: number; employeeId: string; email: string; departmentId?: number; jobRoleId?: number };
}
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const env = loadEnv();
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as jwt.JwtPayload & {
      sub: string;
      email: string;
      roles: string[];
    };
    req.user = {
      id: payload.sub as string,
      email: payload.email!,
      roles: payload.roles || [],
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function authenticateEmployee(
  req: EmployeeAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const env = loadEnv();
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as jwt.JwtPayload & {
      sub: string;
      employeeId: string;
      email: string;
      departmentId?: number;
      jobRoleId?: number;
    };
    req.employee = {
      id: parseInt(payload.sub),
      employeeId: payload.employeeId,
      email: payload.email,
      departmentId: payload.departmentId,
      jobRoleId: payload.jobRoleId,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
