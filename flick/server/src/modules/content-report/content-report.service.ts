import { HttpError } from "@/core/http";
import ContentReportRepo from "./content-report.repo";
import { ContentReportInsert } from "@/infra/db/tables/content-report.table";

class ContentReportService {
  static async createReport(values: ContentReportInsert) {
    const report = await ContentReportRepo.Write.create(values);

    if (!report) throw HttpError.internal("Failed to create report");

    return report;

    // TODO: Add logging when log service is available
    // logEvent({
    //   req,
    //   action: "user_reported_content",
    //   platform: "web",
    //   userId: userId.toString(),
    //   metadata: {
    //     type,
    //     targetId,
    //     reason,
    //   },
    // });
  }

  static async getReportById(id: string) {
    const report = await ContentReportRepo.Read.findById(id);
    if (!report) throw HttpError.notFound("Report not found");
    return report;
  }

  static async getUserReports(userId: number) {
    return await ContentReportRepo.Read.findByUserId(userId);
  }

  static async getAllReports() {
    return await ContentReportRepo.Read.findAll();
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
    return report;
  }

  static async updateReportsByTargetId(
    targetId: number,
    type: "Post" | "Comment",
    status: string = "resolved"
  ) {
    return await ContentReportRepo.Write.updateManyByTargetId(targetId, type, status);
  }

  static async deleteReport(id: string) {
    const deleted = await ContentReportRepo.Write.delete(id);
    if (!deleted) throw HttpError.notFound("Report not found");
    return { success: true };
  }

  static async bulkDeleteReports(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw HttpError.badRequest("Report IDs must be a non-empty array");
    }

    const deletedCount = await ContentReportRepo.Write.deleteManyByIds(ids);
    return { success: true, deletedCount };
  }
}

export default ContentReportService