import db from "@/config/db.js";
import type { Prisma } from "@prisma/client";

interface GetLeadsParams {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  assignedTo?: number;
}

interface CreateLeadData {
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
  assignedTo?: number;
}

interface UpdateLeadData {
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

interface AddActivityData {
  type: "call" | "email" | "meeting" | "note" | "task";
  description: string;
  performedBy: number;
}

export class LeadsService {
  static async getLeads(params: GetLeadsParams) {
    const { page, limit, status, priority, assignedTo } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (assignedTo) where.assignedTo = assignedTo;

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          manager: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              activities: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getLeadById(id: number) {
    return db.lead.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  static async createLead(data: CreateLeadData) {
    const leadData: Prisma.LeadCreateInput = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      position: data.position,
      source: data.source,
      priority: data.priority || "medium",
      notes: data.notes,
      value: data.value,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      manager: data.assignedTo ? {
        connect: { id: data.assignedTo }
      } : undefined,
    };

    return db.lead.create({
      data: leadData,
      include: {
        manager: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  static async updateLead(id: number, data: UpdateLeadData) {
    try {
      const updateData: Prisma.LeadUpdateInput = {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        manager: data.assignedTo ? {
          connect: { id: data.assignedTo }
        } : undefined,
      };

      return await db.lead.update({
        where: { id },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Record to update not found")) {
        return null;
      }
      throw error;
    }
  }

  static async deleteLead(id: number) {
    try {
      await db.lead.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
        return false;
      }
      throw error;
    }
  }

  static async addActivity(leadId: number, data: AddActivityData) {
    try {
      // First check if lead exists
      const lead = await db.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return null;
      }

      return await db.leadActivity.create({
        data: {
          leadId,
          type: data.type,
          description: data.description,
          performedBy: data.performedBy,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  static async getLeadActivities(leadId: number) {
    return db.leadActivity.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getLeadStats() {
    const [
      totalLeads,
      statusCounts,
      priorityCounts,
      recentLeads,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      db.lead.groupBy({
        by: ["priority"],
        _count: {
          priority: true,
        },
      }),
      db.lead.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalLeads,
      recentLeads,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      priorityBreakdown: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}