import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import {
  assignUserRoles,
  assignRolesSchema,
  me,
  updateMe,
  updateMeSchema,
} from "@/modules/user/user.controller.js";
import { validate } from "@/core/middlewares/validate.js";

const router = Router();

router.get("/me", authenticate, me);
router.patch("/me", authenticate, validate(updateMeSchema), updateMe);
router.patch(
  "/:id/roles",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate(assignRolesSchema),
  assignUserRoles
);

export default router;
