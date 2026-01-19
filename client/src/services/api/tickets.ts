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
  attachments?: string[];
}

export interface CreateExtraLeaveTicketData {
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  category: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
  attachments?: string[];
}

export interface CreateProfileChangeTicketData {
  profileChanges: Record<string, any>;
  category: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
  attachments?: string[];
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
  async getAllTickets(accessToken: string, query?: TicketListQuery): Promise<{ tickets: Ticket[]; pagination: any }> {
    console.log('🌐 adminTicketsApi.getAllTickets - Called with token:', accessToken ? 'Present' : 'Missing');
    console.log('🌐 adminTicketsApi.getAllTickets - Token length:', accessToken?.length || 0);
    console.log('🌐 adminTicketsApi.getAllTickets - Query:', query);

    const res = await http.get("/tickets/admin/all", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: query,
    });

    console.log('🌐 adminTicketsApi.getAllTickets - Response received:', res.status);
    return res.data;
  },

  async getTicketById(accessToken: string, ticketId: number): Promise<{ ticket: Ticket }> {
    console.log('🌐 adminTicketsApi.getTicketById - Called with token:', accessToken ? 'Present' : 'Missing');

    const res = await http.get(`/tickets/admin/${ticketId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('🌐 adminTicketsApi.getTicketById - Response received:', res.status);
    return res.data;
  },

  // Update ticket status
  async updateTicketStatus(accessToken: string, ticketId: number, data: UpdateTicketStatusData): Promise<{ ticket: Ticket }> {
    console.log('🌐 adminTicketsApi.updateTicketStatus - Called with token:', accessToken ? 'Present' : 'Missing');

    const res = await http.patch(`/tickets/admin/${ticketId}/status`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('🌐 adminTicketsApi.updateTicketStatus - Response received:', res.status);
    return res.data;
  },

  // Comments
  async addComment(accessToken: string, ticketId: number, data: CreateTicketCommentData): Promise<{ comment: TicketComment }> {
    console.log('🌐 adminTicketsApi.addComment - Called with token:', accessToken ? 'Present' : 'Missing');

    const res = await http.post(`/tickets/admin/${ticketId}/comments`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('🌐 adminTicketsApi.addComment - Response received:', res.status);
    return res.data;
  },

  // Statistics
  async getStatistics(accessToken: string, employeeId?: number): Promise<{ statistics: TicketStatistics }> {
    console.log('🌐 adminTicketsApi.getStatistics - Called with token:', accessToken ? 'Present' : 'Missing');

    const res = await http.get("/tickets/admin/statistics", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: employeeId ? { employeeId } : undefined,
    });

    console.log('🌐 adminTicketsApi.getStatistics - Response received:', res.status);
    return res.data;
  },
};

// Shared API
export const ticketsApi = {
  async getCategories(): Promise<{ categories: TicketCategories }> {
    console.log("🌐 ticketsApi.getCategories - Making request to /tickets/categories");
    try {
      const res = await http.get("/tickets/categories");
      console.log("🌐 ticketsApi.getCategories - Response received:", res.status, res.data);
      return res.data;
    } catch (error) {
      console.error("🌐 ticketsApi.getCategories - Error:", error);
      throw error;
    }
  },
};