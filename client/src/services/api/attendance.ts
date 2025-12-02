import { employeeHttp } from "./employee-http";

export interface Attendance {
    id: number;
    employeeId: number;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    duration: number | null;
    type: string | null;
    ipAddress: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceStatus {
    hasActiveSession: boolean;
    attendance: Attendance | null;
}

export interface AttendanceHistoryParams {
    startDate?: string;
    endDate?: string;
}

export async function punchIn(accessToken: string) {
    const res = await employeeHttp.post("/attendance/punch-in", {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { attendance: Attendance };
}

export async function punchOut(accessToken: string) {
    const res = await employeeHttp.post("/attendance/punch-out", {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as { attendance: Attendance };
}

export async function getAttendanceHistory(
    accessToken: string,
    params?: AttendanceHistoryParams
) {
    const res = await employeeHttp.get("/attendance/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
    });
    return res.data as { attendances: Attendance[] };
}

export async function getTodayStatus(accessToken: string) {
    const res = await employeeHttp.get("/attendance/today", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data as AttendanceStatus;
}
