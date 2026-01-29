import { Request, Response } from "express";
import { Controller } from "@/core/http/controller.js";
import HttpResponse from "@/core/http/response.js";
import HttpError from "@/core/http/error.js";
import ContentReportService from "./content-report.service.js";
import UserManagementService from "./user-management.service.js";
import ContentModerationService from "./content-moderation.service.js";
import { ContentReportInsert } from "@/infra/db/tables/content-report.table.js";
import * as contentReportSchemas from "./content-report.schema.js";
import recordAudit from "@/lib/record-audit.js";
import { AuditAction } from "@/shared/constants/audit/actions.js";

@Controller()
class ContentReportController {
  static async createReport(req: Request) {
    const { type, reason, message, targetId } = contentReportSchemas.CreateReportSchema.parse(req.body);
    const userId = req.user.id;

    const isTargetedPost = type === "Post"

    const reportData: ContentReportInsert = {
      type,
      reportedBy: userId,
      reason,
      message,
      ...(isTargetedPost ? { postId: targetId } : { commentId: targetId })
    };

    const report = await ContentReportService.createReport(reportData);

    return HttpResponse.created("Report created successfully", { report });
  }

  static async getReports(req: Request) {
    const { type, limit, page, status } = contentReportSchemas.GetReportsQuerySchema.parse(req.query)

    const result = await ContentReportService.getReportsWithFilters({
      type,
      statuses: status,
      page,
      limit
    });

    return HttpResponse.ok(
      result.reports.length
        ? "Reported content fetched successfully."
        : "No reported content found.",
      {
        data: result.reports,
        pagination: result.pagination,
        filters: { status, type }
      }
    );
  }

  static async getReportById(req: Request) {
    const { id } = contentReportSchemas.ReportParamsSchema.parse(req.params);
    const report = await ContentReportService.getReportById(id);
    return HttpResponse.ok("Report fetched successfully", { report });
  }

  static async getUserReports(req: Request) {
    const { userId } = req.params;

    if (!/^\d+$/.test(userId)) {
      throw HttpError.badRequest("Invalid userId");
    }

    const reports = await ContentReportService.getUserReports(userId);
    return HttpResponse.ok("User reports fetched successfully", { reports });
  }

  static async updateReportStatus(req: Request) {
    const { id } = contentReportSchemas.ReportParamsSchema.parse(req.params);
    const { status } = contentReportSchemas.UpdateReportStatusSchema.parse(req.body);
    
    const report = await ContentReportService.updateReportStatus(id, status);

    await recordAudit({
      action: "admin:updated:report:status",
      metadata: { reportId: id, status },
      entityType: "content-report",
    });

    return HttpResponse.ok("Report status updated successfully", { report });
  }

  static async deleteReport(req: Request) {
    const { id } = contentReportSchemas.ReportParamsSchema.parse(req.params);
    const result = await ContentReportService.deleteReport(id);

    await recordAudit({
      action: "admin:deleted:report",
      metadata: { reportId: id },
      entityType: "content-report"
    });

    return HttpResponse.ok("Report deleted successfully", result);
  }

  static async bulkDeleteReports(req: Request) {
    const { reportIds } = contentReportSchemas.BulkDeleteReportsSchema.parse(req.body);

    if (!Array.isArray(reportIds)) {
      throw HttpError.badRequest("Report ids must be an array");
    }

    const result = await ContentReportService.bulkDeleteReports(reportIds);

    await recordAudit({
      action: "admin:bulk-deleted:reports",
      metadata: { reportIds, deletedCount: result.deletedCount },
      entityType: "content-report"
    });

    return HttpResponse.ok("Reports deleted successfully", result);
  }

  static async updateContentStatus(req: Request) {
    const { targetId } = contentReportSchemas.ContentParamsSchema.parse(req.params);
    const { action, type } = contentReportSchemas.UpdateContentStatusSchema.parse(req.body);

    const result = await ContentModerationService.moderateContent(targetId, type, action);

    let adminAction: "shadow:banned" | "shadow:unbanned" | "banned" | "unbanned" = null

    switch (action) {
      case "unban":
        adminAction = "unbanned"
        break
      case "shadowBan":
        adminAction = "shadow:banned"
        break
      case "shadowUnban":
        adminAction = "shadow:unbanned"
      default:
        adminAction = "banned"
    }

    const auditAction: AuditAction = `admin:${adminAction}:content`;

    await recordAudit({
      action: auditAction,
      metadata: { targetId, type, action },
      entityType: "content-report"
    });

    return HttpResponse.ok(result.message, result);
  }

  static async blockUser(req: Request) {
    const { userId } = contentReportSchemas.UserParamsSchema.parse(req.params);
    const result = await UserManagementService.blockUser(userId);

    await recordAudit({
      action: "admin:banned:user",
      metadata: { userId },
      entityType: "content-report"
    });

    return HttpResponse.ok(result.message, result);
  }

  static async unblockUser(req: Request) {
    const { userId } = contentReportSchemas.UserParamsSchema.parse(req.params);
    const result = await UserManagementService.unblockUser(userId);

    await recordAudit({
      action: "admin:unbanned:user",
      metadata: { userId },
      entityType: "content-report"
    });

    return HttpResponse.ok(result.message, result);
  }

  static async suspendUser(req: Request) {
    const { userId } = contentReportSchemas.UserParamsSchema.parse(req.params);
    const { ends, reason } = contentReportSchemas.SuspendUserSchema.parse(req.body);

    if (!ends || !reason) {
      throw HttpError.badRequest("End date and reason are required");
    }

    const suspensionData = {
      ends: new Date(ends),
      reason,
    };

    const result = await UserManagementService.suspendUser(userId, suspensionData);

    await recordAudit({
      action: "admin:suspended:user",
      metadata: { userId, ends, reason },
      entityType: "content-report"
    });

    return HttpResponse.ok(result.message, result);
  }

  static async getSuspensionStatus(req: Request) {
    const { userId } = contentReportSchemas.UserParamsSchema.parse(req.params);
    const result = await UserManagementService.getSuspensionStatus(userId);
    return HttpResponse.ok("Suspension status fetched successfully", result);
  }

  static async getUsersByQuery(req: Request) {
    const { email, username } = contentReportSchemas.GetUsersQuerySchema.parse(req.query);

    const result = await UserManagementService.getUsersByQuery({ email, username });
    return HttpResponse.ok("Users fetched successfully", result);
  }

  // Legacy method exports for backward compatibility
  static banPost = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );

  static unbanPost = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );

  static shadowBanPost = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );

  static shadowUnbanPost = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );

  static banComment = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );

  static unbanComment = (req: Request, res: Response) =>
    ContentReportController.updateContentStatus(req).then(result =>
      res.status(200).json(result)
    );
}

export default ContentReportController;