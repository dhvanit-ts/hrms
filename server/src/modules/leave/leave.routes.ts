import { Router } from "express";
import { authenticate } from "../../core/middlewares/auth.js";
import { requireRoles } from "../../core/middlewares/rbac.js";
import {
  applyLeaveHandler,
  applyLeaveSchema,
  approveLeaveHandler,
  approveLeaveSchema,
  rejectLeaveHandler,
  rejectLeaveSchema,
  leaveBalanceHandler,
  myLeavesHandler,
  pendingLeavesHandler,
  currentLeavesHandler,
  upcomingLeavesHandler,
} from "./leave.controller.js";
import { validate } from "../../core/middlewares/validate.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee endpoints - accessible by all authenticated employees
// POST /api/leaves - Apply for leave with validation
router.post("/", validate(applyLeaveSchema), applyLeaveHandler);

// GET /api/leaves/my-leaves - Get employee's leave history with status filtering
router.get("/my-leaves", myLeavesHandler);

// GET /api/leaves/balance - Get employee's leave balance
router.get("/balance", leaveBalanceHandler);

// Admin endpoints - require HR, MANAGER, ADMIN, or SUPER_ADMIN roles
// GET /api/leaves/pending - Get all pending leave requests (admin only)
router.get(
  "/pending",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  pendingLeavesHandler
);

// PATCH /api/leaves/:id/approve - Approve leave request (admin only)
router.patch(
  "/:id/approve",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  validate(approveLeaveSchema),
  approveLeaveHandler
);

// PATCH /api/leaves/:id/reject - Reject leave request (admin only)
router.patch(
  "/:id/reject",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  validate(rejectLeaveSchema),
  rejectLeaveHandler
);

// GET /api/leaves/current - Get employees currently on leave (admin only)
router.get(
  "/current",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  currentLeavesHandler
);

// GET /api/leaves/upcoming - Get upcoming approved leaves (admin only)
router.get(
  "/upcoming",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  upcomingLeavesHandler
);

export default router;
