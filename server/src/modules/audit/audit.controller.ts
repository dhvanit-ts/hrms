import { Request, Response } from "express";
import { asyncHandlerCb, ApiResponse, ApiError } from "@/core/http";
import { getAuditReports, getAuditReportById } from "./audit.service";
import { z } from "zod";

const auditQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  entity: z.string().optional(),
  action: z.string().optional(),
  performedBy: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getAuditLogs = asyncHandlerCb(async (req: Request, res: Response) => {
  const query = auditQuerySchema.parse(req.query);

  const result = await getAuditReports({
    page: query.page,
    limit: query.limit,
    filters: {
      entity: query.entity,
      action: query.action,
      performedBy: query.performedBy,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }
  });

  return ApiResponse.ok(res, {
    data: result,
    message: "Audit logs retrieved successfully",
  });
});

export const getAuditLog = asyncHandlerCb(async (req: Request, res: Response) => {
  const { id } = req.params;
  const auditLog = await getAuditReportById(parseInt(id));

  if (!auditLog) {
    throw new ApiError({
      message: "Audit log not found",
      statusCode: 404,
    });
  }

  return ApiResponse.ok(res, {
    data: auditLog,
    message: "Audit log retrieved successfully",
  });
});