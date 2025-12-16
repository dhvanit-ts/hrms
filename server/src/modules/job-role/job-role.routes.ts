import { Router } from "express";
import { authenticate } from "../../core/middlewares/auth.js";
import { requireRoles } from "../../core/middlewares/rbac.js";
import { validate } from "../../core/middlewares/validate.js";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  createJobRoleSchema,
  updateJobRoleSchema,
  deleteJobRoleSchema
} from "./job-role.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin role requirement for all job role operations
const adminRoles = requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN");

// GET /api/job-roles - List all job roles (with optional includeInactive query param)
router.get("/", adminRoles, listRoles);

// GET /api/job-roles/:id - Get specific job role
router.get("/:id", adminRoles, getRole);

// POST /api/job-roles - Create new job role
router.post("/", adminRoles, validate(createJobRoleSchema), createRole);

// PATCH /api/job-roles/:id - Update job role
router.patch("/:id", adminRoles, validate(updateJobRoleSchema), updateRole);

// DELETE /api/job-roles/:id - Delete job role
router.delete("/:id", adminRoles, validate(deleteJobRoleSchema), deleteRole);

export default router;