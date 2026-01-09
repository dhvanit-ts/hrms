import * as ContentReportAdapter from "@/infra/db/adapters/content-report.adapter"

const ContentReportRepo = {
  Read: {
    findById: ContentReportAdapter.findById,
    findByUserId: ContentReportAdapter.findByUserId,
    findAll: ContentReportAdapter.findAll,
    findWithFilters: ContentReportAdapter.findWithFilters,
    findByTargetId: ContentReportAdapter.findByTargetId
  },
  CachedRead: {},
  Write: {
    create: ContentReportAdapter.create,
    updateStatus: ContentReportAdapter.updateStatus,
    updateManyByTargetId: ContentReportAdapter.updateManyByTargetId,
    delete: ContentReportAdapter.deleteById,
    deleteManyByIds: ContentReportAdapter.deleteManyByIds
  }
}

export default ContentReportRepo;