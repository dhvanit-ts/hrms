import { Router } from "express";
import { authenticate } from "../../core/middlewares/auth.js";
import { requireRoles } from "../../core/middlewares/rbac.js";
import { validate } from "../../core/middlewares/validate.js";
import {
  listDept,
  getDept,
  createDept,
  updateDept,
  deleteDept,
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema
} from "./department.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin role requirement for all department operations
const adminRoles = requireRoles("HR", "MANAGER", "ADMIN", "SUPER_ADMIN");

// GET /api/departments - List all departments
router.get("/", adminRoles, listDept);

// GET /api/departments/:id - Get specific department
router.get("/:id", adminRoles, getDept);

// POST /api/departments - Create new department
router.post("/", adminRoles, validate(createDepartmentSchema), createDept);

// PATCH /api/departments/:id - Update department
router.patch("/:id", adminRoles, validate(updateDepartmentSchema), updateDept);

// DELETE /api/departments/:id - Delete department
router.delete("/:id", adminRoles, validate(deleteDepartmentSchema), deleteDept);

export default router;