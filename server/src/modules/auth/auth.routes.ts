import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
  loginSchema,
  registerSchema,
  refreshSchema,
} from "./auth.controller";
import {
  employeeLogin,
  employeeLogout,
  employeeRefresh,
  setupPassword,
  employeeLoginSchema,
  employeeRefreshSchema,
  employeeSetupPasswordSchema,
} from "./employee-auth.controller";
import { validate } from "@/core/middlewares/validate";

const router = Router();

// Admin/HR routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", validate(refreshSchema), refresh);

// Employee routes
router.post("/employee/setup-password", validate(employeeSetupPasswordSchema), setupPassword);
router.post("/employee/login", validate(employeeLoginSchema), employeeLogin);
router.post("/employee/logout", employeeLogout);
router.post("/employee/refresh", validate(employeeRefreshSchema), employeeRefresh);

export default router;
