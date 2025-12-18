import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import {
  createEmp,
  createEmployeeSchemaWithBody,
  getEmp,
  getMe,
  listEmp,
  removeEmp,
  updateEmp,
  updateEmployeeSchema,
} from "@/modules/employee/employee.controller";
import { validate } from "@/core/middlewares/validate.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.get("/", requireRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER"), listEmp);
router.get(
  "/:id",
  requireRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER"),
  getEmp
);
router.post(
  "/",
  requireRoles("HR", "ADMIN", "SUPER_ADMIN"),
  validate(createEmployeeSchemaWithBody),
  createEmp
);
router.patch(
  "/:id",
  requireRoles("HR", "ADMIN", "SUPER_ADMIN"),
  validate(updateEmployeeSchema),
  updateEmp
);
router.delete("/:id", requireRoles("ADMIN", "SUPER_ADMIN"), removeEmp);

export default router;
