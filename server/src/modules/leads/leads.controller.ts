import type { Request, Response } from "express";
import { ApiError, AsyncHandler } from "../../core/http";
import type { AuthenticatedRequest } from "../../core/middlewares/auth.js";
import { LeadsService } from "./leads.service.js";

export class LeadsController {
  @AsyncHandler()
  static async getLeads(req: AuthenticatedRequest, res: Response) {
    const { page = 1, limit = 10, status, priority, assignedTo } = req.query;

    const leads = await LeadsService.getLeads({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo ? Number(assignedTo) : undefined,
    });

    return res.json({ data: leads });
  }

  @AsyncHandler()
  static async getLeadById(req: Request, res: Response) {
    const { id } = req.params;
    const lead = await LeadsService.getLeadById(Number(id));

    if (!lead) {
      return new ApiError({ statusCode: 404, message: "Lead not found" });
    }

    return res.json({ data: lead });
  }

  @AsyncHandler()
  static async createLead(req: AuthenticatedRequest, res: Response) {
    const leadData = req.body;
    const createdBy = req.user!.id;

    const lead = await LeadsService.createLead({
      ...leadData,
      assignedTo: parseInt(createdBy), // Assign to creator by default
    });

    return res.status(201).json({ data: lead });
  }

  @AsyncHandler()
  static async updateLead(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    const lead = await LeadsService.updateLead(Number(id), updateData);

    if (!lead) {
      return new ApiError({ statusCode: 404, message: "Lead not found" });
    }

    return res.json({ data: lead });
  }

  @AsyncHandler()
  static async deleteLead(req: Request, res: Response) {
    const { id } = req.params;

    const deleted = await LeadsService.deleteLead(Number(id));

    if (!deleted) {
      return new ApiError({ statusCode: 404, message: "Lead not found" });
    }

    return res.json({ message: "Lead deleted successfully" });
  }

  @AsyncHandler()
  static async addActivity(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { type, description } = req.body;
    const performedBy = req.user!.id;

    const activity = await LeadsService.addActivity(Number(id), {
      type,
      description,
      performedBy: parseInt(performedBy),
    });

    if (!activity) {
      return new ApiError({ statusCode: 404, message: "Lead not found" });
    }

    return res.status(201).json({ data: activity });
  }

  @AsyncHandler()
  static async getLeadActivities(req: Request, res: Response) {
    const { id } = req.params;

    const activities = await LeadsService.getLeadActivities(Number(id));

    return res.json({ data: activities });
  }

  @AsyncHandler()
  static async getLeadStats(req: AuthenticatedRequest, res: Response) {
    const stats = await LeadsService.getLeadStats();
    return res.json({ data: stats });
  }
}