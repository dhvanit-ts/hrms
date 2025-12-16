import { http } from "./http";

export interface JobRole {
  id: number;
  title: string;
  level: number;
  description?: string;
  isActive: boolean;
  _count: {
    employees: number;
  };
}

export interface CreateJobRoleDTO {
  title: string;
  level: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateJobRoleDTO {
  title?: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

export interface JobRoleListResponse {
  jobRoles: JobRole[];
}

export interface JobRoleResponse {
  jobRole: JobRole;
}

export async function getJobRoles(accessToken: string, includeInactive = false): Promise<JobRoleListResponse> {
  const res = await http.get("/job-roles", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { includeInactive: includeInactive.toString() }
  });
  return res.data.data;
}

export async function getJobRole(accessToken: string, id: number): Promise<JobRoleResponse> {
  const res = await http.get(`/job-roles/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function createJobRole(accessToken: string, data: CreateJobRoleDTO): Promise<JobRoleResponse> {
  const res = await http.post("/job-roles", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function updateJobRole(accessToken: string, id: number, data: UpdateJobRoleDTO): Promise<JobRoleResponse> {
  const res = await http.patch(`/job-roles/${id}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function deleteJobRole(accessToken: string, id: number): Promise<void> {
  await http.delete(`/job-roles/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}