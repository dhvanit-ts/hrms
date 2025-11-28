import { Router } from "express";
import { authenticate } from "../../core/middlewares/auth.js";
import { requireRoles } from "../../core/middlewares/rbac.js";
import {
  applyLeaveHandler,
  applyLeaveSchema,
  approveRejectHandler,
  approveRejectSchema,
  leaveBalanceHandler,
  myLeavesHandler,
  pendingLeavesHandler,
} from "./leave.controller.js";
import { validate } from "../../core/middlewares/validate.js";

const router = Router();
router.use(authenticate);

// employee self/apply and listing own leaves
router.post("/", validate(applyLeaveSchema), applyLeaveHandler);
router.get("/mine", myLeavesHandler);
router.get("/balance", leaveBalanceHandler);

// approvals: HR, MANAGER, ADMIN, SUPER_ADMIN
router.get(
  "/pending",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  pendingLeavesHandler
);
router.patch(
  "/:id/status",
  requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN"),
  validate(approveRejectSchema),
  approveRejectHandler
);

export default router;
