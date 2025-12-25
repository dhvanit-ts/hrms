import { employeeHttp } from "./employee-http";

export interface EmployeeProfile {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  shiftId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  status: "active" | "inactive" | "terminated";
  salary?: number | null;
  leaveAllowance?: number | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: number;
    name: string;
  } | null;
  jobRole?: {
    id: number;
    title: string;
  } | null;
  shift?: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    breakTime: number;
    isDefault?: boolean;
  } | null;
}

export async function getEmployeeProfile(accessToken: string): Promise<{ employee: EmployeeProfile }> {
  const res = await employeeHttp.get("/auth/employee/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}