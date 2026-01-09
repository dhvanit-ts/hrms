import { Router } from "express";
import ContentReportController from "./content-report.controller.js";
import { authenticate } from "@/core/middlewares/index.js";

const router = Router();

// Report management
router.route("/").post(authenticate, ContentReportController.createReport);
router.route("/").get(authenticate, ContentReportController.getReports);
router.route("/:id").get(authenticate, ContentReportController.getReportById);
router.route("/user/:userId").get(authenticate, ContentReportController.getUserReports);
router.route("/:id/status").patch(authenticate, ContentReportController.updateReportStatus);
router.route("/:id").delete(authenticate, ContentReportController.deleteReport);
router.route("/bulk-delete").post(authenticate, ContentReportController.bulkDeleteReports);

// Content moderation
router.route("/content/:targetId/moderate").patch(authenticate, ContentReportController.updateContentStatus);

// Legacy content moderation routes (for backward compatibility)
router.route("/post/:targetId/ban").patch(authenticate, ContentReportController.banPost);
router.route("/post/:targetId/unban").patch(authenticate, ContentReportController.unbanPost);
router.route("/post/:targetId/shadow-ban").patch(authenticate, ContentReportController.shadowBanPost);
router.route("/post/:targetId/shadow-unban").patch(authenticate, ContentReportController.shadowUnbanPost);
router.route("/comment/:targetId/ban").patch(authenticate, ContentReportController.banComment);
router.route("/comment/:targetId/unban").patch(authenticate, ContentReportController.unbanComment);

// User management
router.route("/user/:userId/block").patch(authenticate, ContentReportController.blockUser);
router.route("/user/:userId/unblock").patch(authenticate, ContentReportController.unblockUser);
router.route("/user/:userId/suspend").patch(authenticate, ContentReportController.suspendUser);
router.route("/user/:userId/suspension").get(authenticate, ContentReportController.getSuspensionStatus);
router.route("/users/search").get(authenticate, ContentReportController.getUsersByQuery);

export default router;
