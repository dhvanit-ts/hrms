import { employeeHttp } from "./employee-http";
import { http } from "./http";

export interface AttendanceCorrectionRequest {
  id: number;
  employeeId: number;
  attendanceId: number;
  requestType: "CHECK_IN_TIME" | "CHECK_OUT_TIME" | "BOTH_TIMES" | "MISSING_CHECK_IN" | "MISSING_CHECK_OUT";
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  currentCheckIn?: string;
  currentCheckOut?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewerId?: number;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  employee: {
    id: number;
    name: string;
    employeeId: string;
    email?: string;
  };
  attendance: {
    id: number;
    date: string;
    checkIn?: string;
    checkOut?: string;
  };
  reviewer?: {
    id: number;
    email: string;
  };
}

export interface CreateCorrectionRequestData {
  attendanceId: number;
  requestType: "CHECK_IN_TIME" | "CHECK_OUT_TIME" | "BOTH_TIMES" | "MISSING_CHECK_IN" | "MISSING_CHECK_OUT";
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

export interface ReviewCorrectionRequestData {
  status: "approved" | "rejected";
  reviewerNotes?: string;
}

export interface GetRequestsFilters {
  status?: "pending" | "approved" | "rejected";
  employeeId?: number;
  limit?: number;
  offset?: number;
}

// Employee API functions
export const attendanceCorrectionEmployeeApi = {
  // Create a new correction request
  async createRequest(data: CreateCorrectionRequestData): Promise<AttendanceCorrectionRequest> {
    const response = await employeeHttp.post("/attendance-corrections", data);
    return response.data.data || response.data;
  },

  // Get my correction requests
  async getMyRequests(filters?: GetRequestsFilters): Promise<AttendanceCorrectionRequest[]> {
    const response = await employeeHttp.get("/attendance-corrections/my-requests", {
      params: filters,
    });
    // Handle both direct array and wrapped response
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Get a specific request by ID
  async getRequestById(id: number): Promise<AttendanceCorrectionRequest> {
    const response = await employeeHttp.get(`/attendance-corrections/${id}`);
    return response.data.data || response.data;
  },
};

// Admin API functions
export const attendanceCorrectionAdminApi = {
  // Get all correction requests
  async getAllRequests(filters?: GetRequestsFilters): Promise<AttendanceCorrectionRequest[]> {
    const response = await http.get("/admin/attendance-corrections", {
      params: filters,
    });
    // Handle both direct array and wrapped response
    const data = response.data.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Get a specific request by ID
  async getRequestById(id: number): Promise<AttendanceCorrectionRequest> {
    const response = await http.get(`/admin/attendance-corrections/${id}`);
    return response.data.data || response.data;
  },

  // Review a correction request
  async reviewRequest(id: number, data: ReviewCorrectionRequestData): Promise<AttendanceCorrectionRequest> {
    const response = await http.patch(`/admin/attendance-corrections/${id}/review`, data);
    return response.data.data || response.data;
  },
};