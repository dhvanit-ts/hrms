import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import {
  checkInHandler,
  checkOutHandler,
  checkSchema,
  summaryHandler,
  summarySchema,
  historyHandler,
  historySchema,
  todayStatusHandler,
} from "./attendance.controller";
import { validate } from "@/core/middlewares/validate.js";

const router = Router();
router.use(authenticate);

// employees can self check-in/out; managers/admins can specify employeeId for team ops (optional)
router.post("/check-in", validate(checkSchema), checkInHandler);
router.post("/check-out", validate(checkSchema), checkOutHandler);

// employee attendance history and today's status
router.get("/history", validate(historySchema), historyHandler);
router.get("/today", todayStatusHandler);

// summaries restricted to HR/MANAGER/ADMIN/SUPER_ADMIN
router.get(
  "/summary",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  validate(summarySchema),
  summaryHandler
);

export default router;
