import { employeeHttp } from "./employee-http";
import { http } from "./http";

export interface LeaveRequest {
    id: number;
    employeeId: number;
    type: string;
    startDate: string;
    endDate: string;
    status: "pending" | "approved" | "rejected";
    approverId: number | null;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LeaveBalance {
    year: number;
    allowance: number;
    usedDays: number;
    remaining: number;
}

export interface ApplyLeaveParams {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
}

export interface GetMyLeavesParams {
    status?: "pending" | "approved" | "rejected";
}

export async function applyLeave(
    accessToken: string,
    params: ApplyLeaveParams
) {
    try {
        const res = await employeeHttp.post("/leaves", params, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.data as { leave: LeaveRequest };
    } catch (error: any) {
        // Handle validation errors from backend
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to apply for leave"
            );
        }
        throw error;
    }
}

export async function getMyLeaves(
    accessToken: string,
    params?: GetMyLeavesParams
) {
    try {
        const res = await employeeHttp.get("/leaves/my-leaves", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params,
        });
        return res.data as { leaves: LeaveRequest[] };
    } catch (error: any) {
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to fetch leave history"
            );
        }
        throw error;
    }
}

export async function getLeaveBalance(
    accessToken: string,
    year?: number
) {
    try {
        const res = await employeeHttp.get("/leaves/balance", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: year ? { year } : undefined,
        });
        return res.data as { balance: LeaveBalance };
    } catch (error: any) {
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to fetch leave balance"
            );
        }
        throw error;
    }
}

// Admin API methods

export interface PendingLeave {
    id: number;
    employeeId: number;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string | null;
    createdAt: string;
    employee: {
        name: string;
        department: string;
        email: string;
    };
}

export interface GetPendingLeavesParams {
    departmentId?: number;
    department?: string;
    startDate?: string;
    endDate?: string;
}

export async function getPendingLeaves(
    accessToken: string,
    params?: GetPendingLeavesParams
) {
    try {
        const res = await employeeHttp.get("/leaves/pending", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params,
        });
        return res.data as { leaves: PendingLeave[] };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to view pending leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to fetch pending leaves"
            );
        }
        throw error;
    }
}

export async function approveLeave(
    accessToken: string,
    leaveId: number
) {
    try {
        const res = await employeeHttp.patch(`/leaves/${leaveId}/approve`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.data as { leave: LeaveRequest };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to approve leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to approve leave"
            );
        }
        throw error;
    }
}

export async function rejectLeave(
    accessToken: string,
    leaveId: number,
    reason?: string
) {
    try {
        const res = await employeeHttp.patch(`/leaves/${leaveId}/reject`,
            { reason },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        return res.data as { leave: LeaveRequest };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to reject leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to reject leave"
            );
        }
        throw error;
    }
}

// Admin API methods using regular HTTP client

export async function getPendingLeavesAdmin(
    accessToken: string,
    params?: GetPendingLeavesParams
) {
    try {
        const res = await http.get("/leaves/pending", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params,
        });
        return res.data as { leaves: PendingLeave[] };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to view pending leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to fetch pending leaves"
            );
        }
        throw error;
    }
}

export async function approveLeaveAdmin(
    accessToken: string,
    leaveId: number
) {
    try {
        const res = await http.patch(`/leaves/${leaveId}/approve`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.data as { leave: LeaveRequest };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to approve leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to approve leave"
            );
        }
        throw error;
    }
}

export async function rejectLeaveAdmin(
    accessToken: string,
    leaveId: number,
    reason?: string
) {
    try {
        const res = await http.patch(`/leaves/${leaveId}/reject`,
            { reason },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        return res.data as { leave: LeaveRequest };
    } catch (error: any) {
        // Handle authorization errors
        if (error.response?.status === 403) {
            throw new Error("You do not have permission to reject leaves");
        }
        if (error.response?.data) {
            throw new Error(
                error.response.data.message || "Failed to reject leave"
            );
        }
        throw error;
    }
}
