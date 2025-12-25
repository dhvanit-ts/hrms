import { http } from "./http";

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakTime: number;
  isActive: boolean;
  isDefault?: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
  };
  employees?: Array<{
    id: number;
    employeeId: string;
    name: string;
    email: string;
  }>;
}

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  breakTime?: number;
  description?: string;
}

export interface UpdateShiftData {
  name?: string;
  startTime?: string;
  endTime?: string;
  breakTime?: number;
  description?: string;
  isActive?: boolean;
}

export interface ShiftSchedule {
  shift: Shift;
  employees: Array<{
    id: number;
    employeeId: string;
    name: string;
    email: string;
    department: string;
  }>;
}

export const shiftsApi = {
  // Get all shifts
  getAll: async (includeInactive = false): Promise<{ shifts: Shift[] }> => {
    const response = await http.get(`/shifts?includeInactive=${includeInactive}`);
    return response.data;
  },

  // Get shift by ID
  getById: async (id: number): Promise<{ shift: Shift }> => {
    const response = await http.get(`/shifts/${id}`);
    return response.data;
  },

  // Create new shift
  create: async (data: CreateShiftData): Promise<{ shift: Shift }> => {
    const response = await http.post("/shifts", data);
    return response.data;
  },

  // Update shift
  update: async (id: number, data: UpdateShiftData): Promise<{ shift: Shift }> => {
    const response = await http.put(`/shifts/${id}`, data);
    return response.data;
  },

  // Delete shift (soft delete)
  delete: async (id: number): Promise<{ shift: Shift }> => {
    const response = await http.delete(`/shifts/${id}`);
    return response.data;
  },

  // Assign employees to shift
  assignEmployees: async (shiftId: number, employeeIds: number[]): Promise<{ success: boolean; assignedCount: number }> => {
    const response = await http.post(`/shifts/${shiftId}/assign`, { employeeIds });
    return response.data;
  },

  // Remove employees from shift
  removeEmployees: async (employeeIds: number[]): Promise<{ success: boolean; removedCount: number }> => {
    const response = await http.post("/shifts/unassign", { employeeIds });
    return response.data;
  },

  // Get employees assigned to a shift
  getEmployees: async (shiftId: number): Promise<{ employees: Array<{ id: number; employeeId: string; name: string; email: string; }> }> => {
    const response = await http.get(`/shifts/${shiftId}`);
    return { employees: response.data.shift.employees || [] };
  },

  // Get shift schedule
  getSchedule: async (startDate?: string, endDate?: string): Promise<{ schedule: ShiftSchedule[] }> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await http.get(`/shifts/schedule?${params.toString()}`);
    return response.data;
  },

  // Set default shift
  setDefault: async (id: number): Promise<{ success: boolean; updatedDefaultShift: Shift }> => {
    const response = await http.put(`/shifts/${id}/default`);
    return response.data;
  },
};