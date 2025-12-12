import { Router } from "express";
import {
  bulkDeleteReports,
  deleteReport,
  getUserReports,
  banPost,
  shadowBanPost,
  shadowUnbanPost,
  unbanPost,
  blockUser,
  getSuspensionStatus,
  suspendUser,
  unblockUser,
  updateReportStatus,
  getReports,
  getUsersByQuery,
  banComment,
  unbanComment,
} from "../controllers/report.controller.js";
import { deleteFeedback, getFeedbackById, listFeedbacks, updateFeedbackStatus } from "../controllers/feedback.controller.js";
import { getLogs } from "../controllers/log.controller.js";

const router = Router();

router.route("/reports/status/:reportId").patch(updateReportStatus);
router.route("/reports").get(getReports).delete(deleteReport)
router.route("/reports/many").delete(bulkDeleteReports);
router.route("/reports/users").get(getUserReports);

router.route("/posts/ban/:targetId").patch(banPost);
router.route("/posts/unban/:targetId").patch(unbanPost);
router.route("/posts/shadowban/:targetId").patch(shadowBanPost);
router.route("/posts/shadowunban/:targetId").patch(shadowUnbanPost);

router.route("/comments/ban/:targetId").patch(banComment);
router.route("/comments/unban/:targetId").patch(unbanComment);

router.route("/users/query").get(getUsersByQuery);
router.route("/users/block/:userId").patch(blockUser);
router.route("/users/unblock/:userId").patch(unblockUser);
router.route("/users/suspension/:userId").patch(suspendUser).get(getSuspensionStatus);

router.route("/feedback/single/:id").get(getFeedbackById).delete(deleteFeedback);
router.route("/feedback/status/:id").patch(updateFeedbackStatus)
router.route("/feedback/all").get(listFeedbacks)

router.route("/logs").get(getLogs)

export default router;
