import { Router } from "express";
import {
  verifyUserJWT,
} from "../middleware/auth.middleware.js";
import { listNotifications, markAsSeen } from "../controllers/notification.controller.js";

const router = Router();

router
  .route("/list")
  .get(verifyUserJWT, listNotifications);
router.route("/mark-seen").patch(verifyUserJWT, markAsSeen);

export default router;