import { http } from "./http";

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayData {
  name: string;
  date: string;
  description?: string;
  isRecurring?: boolean;
}

export interface UpdateHolidayData {
  name?: string;
  date?: string;
  description?: string;
  isRecurring?: boolean;
}

export const holidaysApi = {
  getAll: async (year?: number) => {
    const params = year ? { year } : {};
    const response = await http.get<{ data: Holiday[] }>("/holidays", { params });
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await http.get<{ data: Holiday }>(`/holidays/${id}`);
    return response.data.data;
  },

  create: async (data: CreateHolidayData) => {
    const response = await http.post<{ data: Holiday }>("/holidays", data);
    return response.data.data
  },

  update: async (id: number, data: UpdateHolidayData) => {
    const response = await http.put<{ data: Holiday }>(`/holidays/${id}`, data);
    return response.data.data
  },

  delete: async (id: number) => {
    await http.delete(`/holidays/${id}`);
  },
};
