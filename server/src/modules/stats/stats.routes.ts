import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { getStats } from "./stats.controller.js";

const router = Router();

// GET /api/stats - Get dashboard statistics (admin only)
router.get("/", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER"), getStats);

export { router as statsRoutes };