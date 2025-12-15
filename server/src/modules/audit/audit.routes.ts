import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { getAuditLogs, getAuditLog } from "./audit.controller.js";

const router = Router();

// GET /api/audit - Get audit logs with filtering and pagination (admin only)
router.get("/", authenticate, requireRoles("SUPER_ADMIN", "ADMIN"), getAuditLogs);

// GET /api/audit/:id - Get specific audit log (admin only)
router.get("/:id", authenticate, requireRoles("SUPER_ADMIN", "ADMIN"), getAuditLog);

export { router as auditRoutes };