import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import {
  assignUserRoles,
  assignRolesSchema,
  me,
  updateMe,
  updateMeSchema,
  listUsers,
  getUser,
  createUserHandler,
  createUserSchema,
  updateUserHandler,
  updateUserSchema,
  deleteUserHandler,
} from "@/modules/user/user.controller.js";
import { validate } from "@/core/middlewares/validate.js";

const router = Router();

// Own profile routes
router.get("/me", authenticate, me);
router.patch("/me", authenticate, validate(updateMeSchema), updateMe);

// User management routes (superadmin only)
router.get("/", authenticate, requireRoles("SUPER_ADMIN"), listUsers);
router.post("/", authenticate, requireRoles("SUPER_ADMIN"), validate(createUserSchema), createUserHandler);
router.get("/:id", authenticate, requireRoles("SUPER_ADMIN"), getUser);
router.put("/:id", authenticate, requireRoles("SUPER_ADMIN"), validate(updateUserSchema), updateUserHandler);
router.delete("/:id", authenticate, requireRoles("SUPER_ADMIN"), deleteUserHandler);

// Role assignment (admin and superadmin)
router.patch(
  "/:id/roles",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate(assignRolesSchema),
  assignUserRoles
);

export default router;
