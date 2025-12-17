import { http } from "./http";

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: number;
  notes?: string;
  value?: number;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: number;
    email: string;
  };
  _count?: {
    activities: number;
  };
}

export interface LeadActivity {
  id: number;
  leadId: number;
  type: "call" | "email" | "meeting" | "note" | "task";
  description: string;
  performedBy: number;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
}

export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  value?: number;
  followUpDate?: string;
}

export interface UpdateLeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  status?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: number;
  notes?: string;
  value?: number;
  followUpDate?: string;
}

export interface AddActivityData {
  type: "call" | "email" | "meeting" | "note" | "task";
  description: string;
}

export interface LeadStats {
  totalLeads: number;
  recentLeads: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignedTo?: number;
}

export interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const leadsApi = {
  getLeads: (params?: GetLeadsParams): Promise<LeadsResponse> =>
    http.get("/leads", { params }).then((res) => res.data.data),

  getLeadById: (id: number): Promise<Lead> =>
    http.get(`/leads/${id}`).then((res) => res.data.data),

  createLead: (data: CreateLeadData): Promise<Lead> =>
    http.post("/leads", data).then((res) => res.data.data),

  updateLead: (id: number, data: UpdateLeadData): Promise<Lead> =>
    http.put(`/leads/${id}`, data).then((res) => res.data.data),

  deleteLead: (id: number): Promise<void> =>
    http.delete(`/leads/${id}`).then((res) => res.data.data),

  addActivity: (leadId: number, data: AddActivityData): Promise<LeadActivity> =>
    http.post(`/leads/${leadId}/activities`, data).then((res) => res.data.data),

  getLeadActivities: (leadId: number): Promise<LeadActivity[]> =>
    http.get(`/leads/${leadId}/activities`).then((res) => res.data.data),

  getLeadStats: (): Promise<LeadStats> =>
    http.get("/leads/stats").then((res) => res.data.data),
};