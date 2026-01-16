import { Router } from "express";
import ContentReportController from "./content-report.controller.js";
import { authenticate } from "@/core/middlewares/index.js";

const router = Router();

router.use(authenticate)

// Report management
router.route("/").post(ContentReportController.createReport);
router.route("/").get(ContentReportController.getReports);
router.route("/:id").get(ContentReportController.getReportById);
router.route("/user/:userId").get(ContentReportController.getUserReports);
router.route("/:id/status").patch(ContentReportController.updateReportStatus);
router.route("/:id").delete(ContentReportController.deleteReport);
router.route("/bulk-delete").post(ContentReportController.bulkDeleteReports);

// Content moderation
router.route("/content/:targetId/moderate").patch(ContentReportController.updateContentStatus);

// Legacy content moderation routes (for backward compatibility)
router.route("/post/:targetId/ban").patch(ContentReportController.banPost);
router.route("/post/:targetId/unban").patch(ContentReportController.unbanPost);
router.route("/post/:targetId/shadow-ban").patch(ContentReportController.shadowBanPost);
router.route("/post/:targetId/shadow-unban").patch(ContentReportController.shadowUnbanPost);
router.route("/comment/:targetId/ban").patch(ContentReportController.banComment);
router.route("/comment/:targetId/unban").patch(ContentReportController.unbanComment);

// User management
router.route("/user/:userId/block").patch(ContentReportController.blockUser);
router.route("/user/:userId/unblock").patch(ContentReportController.unblockUser);
router.route("/user/:userId/suspend").patch(ContentReportController.suspendUser);
router.route("/user/:userId/suspension").get(ContentReportController.getSuspensionStatus);
router.route("/users/search").get(ContentReportController.getUsersByQuery);

export default router;
