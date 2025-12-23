import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
  changePassword,
  loginSchema,
  registerSchema,
  refreshSchema,
  changePasswordSchema,
} from "./auth.controller";
import {
  employeeLogin,
  employeeLogout,
  employeeRefresh,
  setupPassword,
  employeeChangePassword,
  employeeLoginSchema,
  employeeRefreshSchema,
  employeeSetupPasswordSchema,
  employeeChangePasswordSchema,
} from "./employee-auth.controller";
import { validate } from "@/core/middlewares/validate";
import { authenticateEmployee, authenticate } from "@/core/middlewares/auth";

const router = Router();

// Admin/HR routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", validate(refreshSchema), refresh);
router.patch("/change-password", authenticate, validate(changePasswordSchema), changePassword);

// Employee routes
router.post("/employee/setup-password", validate(employeeSetupPasswordSchema), setupPassword);
router.post("/employee/login", validate(employeeLoginSchema), employeeLogin);
router.post("/employee/logout", employeeLogout);
router.post("/employee/refresh", validate(employeeRefreshSchema), employeeRefresh);
router.patch("/employee/change-password", authenticateEmployee, validate(employeeChangePasswordSchema), employeeChangePassword);

export default router;
