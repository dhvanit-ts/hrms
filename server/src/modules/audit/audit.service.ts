import prisma from "@/config/db.js";
import { Prisma } from "@prisma/client";

export interface AuditFilters {
  entity?: string;
  action?: string;
  performedBy?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditReportsParams {
  page: number;
  limit: number;
  filters: AuditFilters;
}

export async function getAuditReports({ page, limit, filters }: AuditReportsParams) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.entity) {
    where.entity = { contains: filters.entity };
  }

  if (filters.action) {
    where.action = { contains: filters.action };
  }

  if (filters.performedBy) {
    where.performedBy = filters.performedBy;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  // Get total count for pagination
  const total = await prisma.auditLog.count({ where });

  // Get audit logs with pagination
  const auditLogs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    skip,
    take: limit,
  });

  return {
    data: auditLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
}

export async function getAuditReportById(id: number) {
  return await prisma.auditLog.findUnique({
    where: { id },
  });
}

export async function getAuditStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfDay } }
    }),
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfWeek } }
    }),
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfMonth } }
    }),
    prisma.auditLog.count(),
  ]);

  return {
    today: todayCount,
    week: weekCount,
    month: monthCount,
    total: totalCount,
  };
}