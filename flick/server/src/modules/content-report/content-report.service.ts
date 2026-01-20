import { HttpError } from "@/core/http";
import ContentReportRepo from "./content-report.repo";
import { ContentReportInsert } from "@/infra/db/tables/content-report.table";
import logger from "@/core/logger";
import recordAudit from "@/lib/record-audit";
import { shouldSampleLog } from "@/lib/should-sample-log";

class ContentReportService {
  static async createReport(values: ContentReportInsert) {
    if (shouldSampleLog(values.reportedBy)) logger.info("Creating content report", {
      type: values.type,
      postId: values.postId,
      commentId: values.commentId,
      reportedBy: values.reportedBy
    });

    const report = await ContentReportRepo.Write.create(values);

    if (!report) {
      logger.error("Failed to create content report", { values });
      throw HttpError.internal("Failed to create report");
    }

    if (shouldSampleLog(values.reportedBy)) logger.info("Content report created successfully", {
      reportId: report.id,
      type: report.type,
      status: report.status
    });

    await recordAudit({
      action: "user:reported:content",
      entityType: "content-report",
      entityId: report.id,
      after: { id: report.id },
      metadata: { reason: values.reason, reportedBy: values.reportedBy, contentType: values.type }
    })

    return report;
  }

  static async getReportById(id: string) {
    if (shouldSampleLog(id)) logger.info("Fetching report by ID", { reportId: id });

    const report = await ContentReportRepo.Read.findById(id);
    if (!report) {
      logger.warn("Report not found", { reportId: id });
      throw HttpError.notFound("Report not found");
    }

    if (shouldSampleLog(id)) logger.info("Report retrieved successfully", { reportId: id, type: report.type });
    return report;
  }

  static async getUserReports(userId: string) {
    logger.info("Fetching user reports", { userId });
    
    const reports = await ContentReportRepo.Read.findByUserId(userId);
    logger.info("Retrieved user reports", { userId, count: reports.length });
    return reports;
  }

  static async getAllReports() {
    logger.info("Fetching all reports");
    
    const reports = await ContentReportRepo.Read.findAll();
    logger.info("Retrieved all reports", { count: reports.length });
    return reports;
  }

  static async getReportsWithFilters(filters: {
    type?: "Post" | "Comment" | "Both";
    statuses?: string[];
    page?: number;
    limit?: number;
  }) {
    const { reports, totalCount } = await ContentReportRepo.Read.findWithFilters(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    return {
      reports,
      pagination: {
        page,
        limit,
        totalReports: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    };
  }

  static async updateReportStatus(id: string, status: string) {
    const validStatuses = ["pending", "resolved", "ignored"];
    if (!validStatuses.includes(status)) {
      throw HttpError.badRequest("Invalid status value");
    }

    const report = await ContentReportRepo.Write.updateStatus(id, status);
    if (!report) throw HttpError.notFound("Report not found");

    await recordAudit({
      action: "user:reported:content",
      entityType: "content-report",
      entityId: report.id,
      after: { status },
    })

    return report;
  }

  static async updateReportsByTargetId(
    targetId: number,
    type: "Post" | "Comment",
    status: string = "resolved"
  ) {
    const report = await ContentReportRepo.Write.updateManyByTargetId(targetId, type, status);

    await recordAudit({
      action: "user:reported:content",
      entityType: "content-report",
      after: { type, status },
      metadata: { targetId }
    })

    return report
  }

  static async deleteReport(id: string) {
    const deleted = await ContentReportRepo.Write.delete(id);
    if (!deleted) throw HttpError.notFound("Report not found");
    await recordAudit({
      action: "user:reported:content",
      entityType: "content-report",
      entityId: id,
      after: { id },
    })
    return { success: true };
  }

  static async bulkDeleteReports(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw HttpError.badRequest("Report IDs must be a non-empty array");
    }

    const deletedCount = await ContentReportRepo.Write.deleteManyByIds(ids);

    await recordAudit({
      action: "admin:deleted:report",
      entityType: "content-report",
      after: { ids },
      metadata: { deletedCount },
    })

    return { success: true, deletedCount };
  }
}

export default ContentReportService