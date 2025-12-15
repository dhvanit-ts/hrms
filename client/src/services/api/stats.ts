import { http } from "./http";

export interface DashboardStats {
    totalEmployees: number;
    onLeave: number;
    newHires: number;
    openRoles: number;
}

export const statsApi = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await http.get<{ data: { data: DashboardStats } }>("/stats");
        return response.data.data.data;
    },
};