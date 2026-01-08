import { Router } from "express";
import { listNotifications, markAsSeen } from "./notification.controller.js";
import { authenticate } from "@/core/middlewares/index.js";

const router = Router();

router
  .route("/list")
  .get(authenticate, listNotifications);
router.route("/mark-seen").patch(authenticate, markAsSeen);

export default router;