import { http } from "./http";

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  performedBy: number | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface AuditFilters {
  entity?: string;
  action?: string;
  performedBy?: number;
  startDate?: string;
  endDate?: string;
}

export interface AuditReportsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const auditApi = {
  getAuditLogs: async (params: {
    page?: number;
    limit?: number;
    filters?: AuditFilters;
  } = {}): Promise<AuditReportsResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.filters?.entity) searchParams.set('entity', params.filters.entity);
    if (params.filters?.action) searchParams.set('action', params.filters.action);
    if (params.filters?.performedBy) searchParams.set('performedBy', params.filters.performedBy.toString());
    if (params.filters?.startDate) searchParams.set('startDate', params.filters.startDate);
    if (params.filters?.endDate) searchParams.set('endDate', params.filters.endDate);

    const response = await http.get<{ data: { data: AuditReportsResponse } }>(`/audit?${searchParams}`);
    return response.data.data.data;
  },

  getAuditLog: async (id: number): Promise<AuditLog> => {
    const response = await http.get<{ data: { data: AuditLog } }>(`/audit/${id}`);
    return response.data.data.data;
  },
};