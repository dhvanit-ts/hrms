import { employeeHttp } from "./employee-http";
import { http } from "./http";

// Types
export interface Ticket {
  id: number;
  ticketNumber: string;
  employeeId: number;
  type: "attendance_correction" | "extra_leave_request" | "profile_change_request";
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "under_review" | "approved" | "rejected" | "cancelled";
  approverId?: number;
  approverNotes?: string;

  // Attendance correction specific fields
  attendanceId?: number;
  requestedDate?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;

  // Leave request specific fields
  leaveType?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveDays?: number;

  // Profile change specific fields
  profileChanges?: Record<string, any>;

  metadata?: Record<string, any>;
  attachments?: string[];

  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;

  employee: {
    id: number;
    name: string;
    employeeId: string;
    email?: string;
  };
  approver?: {
    id: number;
    name: string;
    employeeId: string;
  };
  attendance?: {
    id: number;
    date: string;
    checkIn?: string;
    checkOut?: string;
  };
  comments?: TicketComment[];
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  authorType: "employee" | "user";
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceCorrectionTicketData {
  attendanceId?: number;
  requestedDate: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  category: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface CreateExtraLeaveTicketData {
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveDays: number;
  category: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface CreateProfileChangeTicketData {
  profileChanges: Record<string, any>;
  category: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface UpdateTicketStatusData {
  status: "approved" | "rejected" | "under_review" | "cancelled";
  approverNotes?: string;
}

export interface CreateTicketCommentData {
  content: string;
  isInternal?: boolean;
}

export interface TicketListQuery {
  status?: string;
  type?: string;
  category?: string;
  priority?: string;
  employeeId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TicketStatistics {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface TicketCategories {
  attendance_correction: string[];
  extra_leave_request: string[];
  profile_change_request: string[];
}

// Employee API (uses employeeHttp)
export const employeeTicketsApi = {
  // Create tickets
  async createAttendanceCorrectionTicket(accessToken: string, data: CreateAttendanceCorrectionTicketData): Promise<{ ticket: Ticket }> {
    const res = await employeeHttp.post("/tickets/attendance-correction", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  async createExtraLeaveTicket(accessToken: string, data: CreateExtraLeaveTicketData): Promise<{ ticket: Ticket }> {
    const res = await employeeHttp.post("/tickets/extra-leave", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  async createProfileChangeTicket(accessToken: string, data: CreateProfileChangeTicketData): Promise<{ ticket: Ticket }> {
    const res = await employeeHttp.post("/tickets/profile-change", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  // Get tickets
  async getMyTickets(accessToken: string, query?: TicketListQuery): Promise<{ tickets: Ticket[]; pagination: any }> {
    const res = await employeeHttp.get("/tickets/my-tickets", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: query,
    });
    return res.data;
  },

  async getMyTicketById(accessToken: string, ticketId: number): Promise<{ ticket: Ticket }> {
    const res = await employeeHttp.get(`/tickets/my-tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  // Comments
  async addComment(accessToken: string, ticketId: number, data: CreateTicketCommentData): Promise<{ comment: TicketComment }> {
    const res = await employeeHttp.post(`/tickets/my-tickets/${ticketId}/comments`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  // Statistics
  async getMyStatistics(accessToken: string): Promise<{ statistics: TicketStatistics }> {
    const res = await employeeHttp.get("/tickets/my-statistics", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },
};

// Admin API (uses http)
export const adminTicketsApi = {
  // Get tickets
  async getAllTickets(query?: TicketListQuery): Promise<{ tickets: Ticket[]; pagination: any }> {
    const res = await http.get("/tickets/admin/all", { params: query });
    return res.data;
  },

  async getTicketById(ticketId: number): Promise<{ ticket: Ticket }> {
    const res = await http.get(`/tickets/admin/${ticketId}`);
    return res.data;
  },

  // Update ticket status
  async updateTicketStatus(ticketId: number, data: UpdateTicketStatusData): Promise<{ ticket: Ticket }> {
    const res = await http.patch(`/tickets/admin/${ticketId}/status`, data);
    return res.data;
  },

  // Comments
  async addComment(ticketId: number, data: CreateTicketCommentData): Promise<{ comment: TicketComment }> {
    const res = await http.post(`/tickets/admin/${ticketId}/comments`, data);
    return res.data;
  },

  // Statistics
  async getStatistics(employeeId?: number): Promise<{ statistics: TicketStatistics }> {
    const res = await http.get("/tickets/admin/statistics", {
      params: employeeId ? { employeeId } : undefined,
    });
    return res.data;
  },
};

// Shared API
export const ticketsApi = {
  async getCategories(): Promise<{ categories: TicketCategories }> {
    const res = await http.get("/tickets/categories");
    return res.data;
  },
};