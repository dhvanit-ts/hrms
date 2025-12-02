import prisma from "@/config/db.js";
import { hashPassword, verifyPassword } from "@/lib/password.js";
import { issueEmployeeAccessToken, issueEmployeeRefreshToken } from "./tokens/employee-token.service.js";
import ApiError from "@/core/http/ApiError.js";
import { logger } from "@/config/logger.js";

export interface EmployeeAuthResult {
  employee: Omit<any, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

export async function setupEmployeePassword(
  employeeId: string,
  password: string
) {
  const employee = await prisma.employee.findUnique({
    where: { employeeId },
  });

  if (!employee) {
    throw new ApiError({
      statusCode: 404,
      message: "Employee not found",
      code: "EMPLOYEE_NOT_FOUND",
    });
  }

  if (employee.passwordHash) {
    throw new ApiError({
      statusCode: 400,
      message: "Password already set",
      code: "PASSWORD_ALREADY_SET",
    });
  }

  const passwordHash = await hashPassword(password);

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data: {
      passwordHash,
      lastLogin: new Date(),
    },
  });

  const accessToken = issueEmployeeAccessToken({
    sub: updated.id.toString(),
    employeeId: updated.employeeId,
    email: updated.email,
    departmentId: updated.departmentId,
    jobRoleId: updated.jobRoleId,
  });

  const { token: refreshToken } = await issueEmployeeRefreshToken(updated.id);

  return {
    employee: { ...updated, passwordHash: undefined },
    accessToken,
    refreshToken,
  };
}

export async function loginEmployee(identifier: string, password: string) {
  // Allow login with either employeeId or email
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeId: identifier },
        { email: identifier },
      ],
    },
    include: {
      department: true,
      jobRole: true,
    },
  });

  if (!employee || employee.status !== "active") {
    logger.info(`Employee login failed: ${identifier}`);
    throw new ApiError({
      statusCode: 401,
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
  }

  if (!employee.passwordHash) {
    throw new ApiError({
      statusCode: 401,
      message: "Password not set. Please contact HR.",
      code: "PASSWORD_NOT_SET",
    });
  }

  const ok = await verifyPassword(password, employee.passwordHash);
  if (!ok) {
    throw new ApiError({
      statusCode: 401,
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
  }

  const accessToken = issueEmployeeAccessToken({
    sub: employee.id.toString(),
    employeeId: employee.employeeId,
    email: employee.email,
    departmentId: employee.departmentId,
    jobRoleId: employee.jobRoleId,
  });

  const { token: refreshToken } = await issueEmployeeRefreshToken(employee.id);

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data: { lastLogin: new Date() },
  });

  return {
    employee: { ...updated, passwordHash: undefined },
    accessToken,
    refreshToken,
  };
}

export async function logoutEmployee(employeeId: number) {
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      refreshTokens: {
        deleteMany: {},
      },
    },
  });
}
