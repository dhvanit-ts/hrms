import { http } from "./http";

export interface User {
    id: number;
    email: string;
    roles: string[];
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    roles: string[];
}

export interface UpdateUserData {
    email?: string;
    password?: string;
    roles?: string[];
    isActive?: boolean;
}

export const usersApi = {
    getAll: async () => {
        const response = await http.get<{ data: User[] }>("/users");
        return response.data.data;
    },

    getById: async (id: number) => {
        const response = await http.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserData) => {
        const response = await http.post<User>("/users", data);
        return response.data;
    },

    update: async (id: number, data: UpdateUserData) => {
        const response = await http.put<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await http.delete(`/users/${id}`);
    },

    assignRoles: async (id: number, roles: string[]) => {
        const response = await http.patch<User>(`/users/${id}/roles`, { roles });
        return response.data;
    },
};
