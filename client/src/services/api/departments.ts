import { http } from "./http";

export interface Department {
  id: number;
  name: string;
  description?: string;
  _count: {
    employees: number;
  };
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
}

export interface DepartmentListResponse {
  departments: Department[];
}

export interface DepartmentResponse {
  department: Department;
}

export async function getDepartments(accessToken: string): Promise<DepartmentListResponse> {
  const res = await http.get("/departments", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
}

export async function getDepartment(accessToken: string, id: number): Promise<DepartmentResponse> {
  const res = await http.get(`/departments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function createDepartment(accessToken: string, data: CreateDepartmentDTO): Promise<DepartmentResponse> {
  const res = await http.post("/departments", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function updateDepartment(accessToken: string, id: number, data: UpdateDepartmentDTO): Promise<DepartmentResponse> {
  const res = await http.patch(`/departments/${id}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function deleteDepartment(accessToken: string, id: number): Promise<void> {
  await http.delete(`/departments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}