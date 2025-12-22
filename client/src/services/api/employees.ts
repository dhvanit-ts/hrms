import { http } from "./http";

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
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
  } | null;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  salary?: number | null;
  leaveAllowance?: number | null;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  shiftId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: "active" | "inactive" | "terminated";
  salary?: number | null;
  leaveAllowance?: number | null;
}

export const employeesApi = {
  // Get all employees
  getAll: async (): Promise<{ employees: Employee[] }> => {
    const response = await http.get("/employees");
    return response.data;
  },

  // Get employee by ID
  getById: async (id: number): Promise<{ employee: Employee }> => {
    const response = await http.get(`/employees/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (data: CreateEmployeeData): Promise<{ employee: Employee }> => {
    const response = await http.post("/employees", data);
    return response.data;
  },

  // Update employee
  update: async (id: number, data: UpdateEmployeeData): Promise<{ employee: Employee }> => {
    const response = await http.patch(`/employees/${id}`, data);
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    await http.delete(`/employees/${id}`);
  },
};