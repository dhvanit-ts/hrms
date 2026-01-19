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

  console.log('🔐 Admin auth middleware - URL:', req.url);
  console.log('🔐 Admin auth middleware - Authorization header:', header ? 'Present' : 'Missing');

  if (!header?.startsWith("Bearer ")) {
    console.log('🔐 Admin auth middleware - No Bearer token found');
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

    console.log('🔐 Admin auth middleware - Token payload:', {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      hasRoles: !!payload.roles
    });

    req.user = {
      id: payload.sub as string,
      email: payload.email!,
      roles: payload.roles || [],
    };

    console.log('🔐 Admin auth middleware - Success, proceeding to next middleware');
    return next();
  } catch (error) {
    console.log('🔐 Admin auth middleware - JWT verification failed:', error);
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

  console.log('👤 Employee auth middleware - URL:', req.url);
  console.log('👤 Employee auth middleware - Authorization header:', header ? 'Present' : 'Missing');

  if (!header?.startsWith("Bearer ")) {
    console.log('👤 Employee auth middleware - No Bearer token found');
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

    console.log('👤 Employee auth middleware - Token payload:', {
      sub: payload.sub,
      employeeId: payload.employeeId,
      email: payload.email,
      hasEmployeeId: !!payload.employeeId
    });

    req.employee = {
      id: parseInt(payload.sub),
      employeeId: payload.employeeId,
      email: payload.email,
      departmentId: payload.departmentId,
      jobRoleId: payload.jobRoleId,
    };

    console.log('👤 Employee auth middleware - Success, proceeding to next middleware');
    return next();
  } catch (error) {
    console.log('👤 Employee auth middleware - JWT verification failed:', error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export interface CombinedAuthenticatedRequest extends Request {
  user?: { id: string; email: string; roles: string[] };
  employee?: { id: number; employeeId: string; email: string; departmentId?: number; jobRoleId?: number };
  authType?: 'admin' | 'employee';
}

export function authenticateAny(
  req: CombinedAuthenticatedRequest,
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
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;

    // Check if it's an admin token (has roles property)
    if (payload.roles) {
      req.user = {
        id: payload.sub as string,
        email: payload.email!,
        roles: payload.roles || [],
      };
      req.authType = 'admin';
      return next();
    }

    // Check if it's an employee token (has employeeId property)
    if (payload.employeeId) {
      req.employee = {
        id: parseInt(payload.sub),
        employeeId: payload.employeeId,
        email: payload.email,
        departmentId: payload.departmentId,
        jobRoleId: payload.jobRoleId,
      };
      req.authType = 'employee';
      return next();
    }

    // Log the payload for debugging
    console.log('Token payload does not match expected format:', payload);
    return res.status(401).json({ error: "Invalid token format" });
  } catch (error) {
    console.log('JWT verification failed:', error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
