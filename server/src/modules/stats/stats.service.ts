import { db } from "@/config/db.js";

export interface DashboardStats {
    totalEmployees: number;
    onLeave: number;
    newHires: number;
    openRoles: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    // Get total active employees
    const totalEmployees = await db.employee.count({
        where: {
            status: "active",
        },
    });

    // Get employees currently on leave (approved leaves that are active today)
    const today = new Date();
    const onLeave = await db.leaveRequest.count({
        where: {
            status: "approved",
            startDate: {
                lte: today,
            },
            endDate: {
                gte: today,
            },
        },
    });

    // Get new hires this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newHires = await db.employee.count({
        where: {
            hireDate: {
                gte: startOfMonth,
            },
            status: "active",
        },
    });

    // Get open job roles (assuming we have a JobRole model with an isActive field)
    const openRoles = await db.jobRole.count({
        where: {
            isActive: true,
        },
    });

    return {
        totalEmployees,
        onLeave,
        newHires,
        openRoles,
    };
}