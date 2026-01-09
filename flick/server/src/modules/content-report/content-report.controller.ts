import { Request, Response } from "express";
import { AsyncHandler } from "@/core/http/controller.js";
import HttpResponse from "@/core/http/response.js";
import HttpError from "@/core/http/error.js";
import ContentReportService from "./content-report.service.js";
import UserManagementService from "./user-management.service.js";
import ContentModerationService from "./content-moderation.service.js";
import { ContentReportInsert } from "@/infra/db/tables/content-report.table.js";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation.js";
import * as contentReportSchemas from "./content-report.schema.js";

const ALLOWED_STATUSES = ["pending", "resolved", "ignored"];

class ContentReportController {
  static createReport = withBodyValidation(contentReportSchemas.createReportSchema, this.createReportHandler)

  @AsyncHandler()
  private static async createReportHandler(req: Request) {
    const { type, reason, message } = req.body;
    const { targetId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw HttpError.unauthorized("User not authenticated");
    }

    // Validate required fields
    if (!targetId || !type || !reason || !message) {
      throw HttpError.badRequest("All fields (targetId, type, reason, message) are required");
    }

    if (!["Post", "Comment"].includes(type)) {
      throw HttpError.badRequest("Invalid report type");
    }

    // Map targetId to postId or commentId based on type
    const reportData: ContentReportInsert = {
      type,
      postId: type === "Post" ? parseInt(targetId) : undefined,
      commentId: type === "Comment" ? parseInt(targetId) : undefined,
      reportedBy: userId,
      reason,
      message,
    };

    const report = await ContentReportService.createReport(reportData);

    return HttpResponse.created("Report created successfully", { report });
  }

  @AsyncHandler()
  static async getReports(req: Request) {
    const page = Math.max(1, Number(req.query.page)) || 1;
    const limit = Math.max(1, Number(req.query.limit)) || 10;
    const type = (req.query.type as "Post" | "Comment" | "Both") || "Both";

    const statusQuery = typeof req.query.status === "string" ? req.query.status : "";
    const requestedStatuses = statusQuery
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => ALLOWED_STATUSES.includes(s));

    const statuses = requestedStatuses.length ? requestedStatuses : ["pending"];

    const result = await ContentReportService.getReportsWithFilters({
      type,
      statuses,
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
        filters: { statuses, type }
      }
    );
  }

  @AsyncHandler()
  static async getReportById(req: Request) {
    const { id } = req.params;
    const report = await ContentReportService.getReportById(id);
    return HttpResponse.ok("Report fetched successfully", { report });
  }

  @AsyncHandler()
  static async getUserReports(req: Request) {
    const { userId } = req.params;

    if (!/^\d+$/.test(userId)) {
      throw HttpError.badRequest("Invalid userId");
    }

    const reports = await ContentReportService.getUserReports(parseInt(userId));
    return HttpResponse.ok("User reports fetched successfully", { reports });
  }

  @AsyncHandler()
  static async updateReportStatus(req: Request) {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      throw HttpError.badRequest("Invalid status value");
    }

    const report = await ContentReportService.updateReportStatus(id, status);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_updated_report_status",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { reportId: id, status },
    // });

    return HttpResponse.ok("Report status updated successfully", { report });
  }

  @AsyncHandler()
  static async deleteReport(req: Request) {
    const { id } = req.params;
    const result = await ContentReportService.deleteReport(id);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_deleted_report",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { reportId: id },
    // });

    return HttpResponse.ok("Report deleted successfully", result);
  }

  @AsyncHandler()
  static async bulkDeleteReports(req: Request) {
    const { reportIds } = req.body;

    if (!Array.isArray(reportIds)) {
      throw HttpError.badRequest("Report ids must be an array");
    }

    const result = await ContentReportService.bulkDeleteReports(reportIds);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_bulk_deleted_reports",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { reportIds, deletedCount: result.deletedCount },
    // });

    return HttpResponse.ok("Reports deleted successfully", result);
  }

  // Content moderation methods
  @AsyncHandler()
  static async updateContentStatus(req: Request) {
    const { targetId } = req.params;
    const { action, type } = req.body;

    if (!targetId || !/^\d+$/.test(targetId)) {
      throw HttpError.badRequest(`Invalid ${type} ID`);
    }

    if (!["Post", "Comment"].includes(type)) {
      throw HttpError.badRequest("Invalid content type");
    }

    const validActions = ["ban", "unban", "shadowBan", "shadowUnban"];
    if (!validActions.includes(action)) {
      throw HttpError.badRequest("Invalid action");
    }

    const result = await ContentModerationService.moderateContent(targetId, type, action);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: `admin_${action}_content`,
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { targetId, type, action },
    // });

    return HttpResponse.ok(result.message, result);
  }

  // User management methods
  @AsyncHandler()
  static async blockUser(req: Request) {
    const { userId } = req.params;
    const result = await UserManagementService.blockUser(userId);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_banned_user",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { userId },
    // });

    return HttpResponse.ok(result.message, result);
  }

  @AsyncHandler()
  static async unblockUser(req: Request) {
    const { userId } = req.params;
    const result = await UserManagementService.unblockUser(userId);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_unbanned_user",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { userId },
    // });

    return HttpResponse.ok(result.message, result);
  }

  @AsyncHandler()
  static async suspendUser(req: Request) {
    const { userId } = req.params;
    const { ends, reason } = req.body;

    if (!ends || !reason) {
      throw HttpError.badRequest("End date and reason are required");
    }

    const suspensionData = {
      ends: new Date(ends),
      reason,
    };

    const result = await UserManagementService.suspendUser(userId, suspensionData);

    // TODO: Add logging when available
    // logEvent({
    //   req,
    //   action: "admin_suspended_user",
    //   platform: "web",
    //   userId: req.admin._id.toString(),
    //   metadata: { userId, ends, reason },
    // });

    return HttpResponse.ok(result.message, result);
  }

  @AsyncHandler()
  static async getSuspensionStatus(req: Request) {
    const { userId } = req.params;
    const result = await UserManagementService.getSuspensionStatus(userId);
    return HttpResponse.ok("Suspension status fetched successfully", result);
  }

  @AsyncHandler()
  static async getUsersByQuery(req: Request) {
    const email = req.query.email as string;
    const username = req.query.username as string;

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