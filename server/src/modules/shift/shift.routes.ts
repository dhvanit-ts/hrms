import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { validate } from "@/core/middlewares/validate.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import {
  createShiftHandler,
  createShiftSchema,
  getAllShiftsHandler,
  getAllShiftsSchema,
  getShiftByIdHandler,
  getShiftByIdSchema,
  updateShiftHandler,
  updateShiftSchema,
  deleteShiftHandler,
  deleteShiftSchema,
  assignEmployeesHandler,
  assignEmployeesSchema,
  removeEmployeesHandler,
  removeEmployeesSchema,
  getScheduleHandler,
  getScheduleSchema,
  updateDefaultShiftSchema,
  updateDefaultShift,
} from "./shift.controller.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all shifts (accessible by all authenticated users)
router.get("/", validate(getAllShiftsSchema), getAllShiftsHandler);

// Get shift schedule (accessible by all authenticated users)
router.get("/schedule", validate(getScheduleSchema), getScheduleHandler);

// Get shift by ID (accessible by all authenticated users)
router.get("/:id", validate(getShiftByIdSchema), getShiftByIdHandler);

// Admin-only routes
router.post("/", requireRoles("SUPER_ADMIN", "ADMIN", "HR"), validate(createShiftSchema), createShiftHandler);
router.put("/:id", requireRoles("SUPER_ADMIN", "ADMIN", "HR"), validate(updateShiftSchema), updateShiftHandler);
router.put("/:id/default", requireRoles("SUPER_ADMIN", "ADMIN", "HR"), validate(updateDefaultShiftSchema), updateDefaultShift);
router.delete("/:id", requireRoles("SUPER_ADMIN", "ADMIN"), validate(deleteShiftSchema), deleteShiftHandler);

// Employee assignment routes (Admin only)
router.post("/:id/assign", requireRoles("SUPER_ADMIN", "ADMIN", "HR"), validate(assignEmployeesSchema), assignEmployeesHandler);
router.post("/unassign", requireRoles("SUPER_ADMIN", "ADMIN", "HR"), validate(removeEmployeesSchema), removeEmployeesHandler);

export default router;