import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
  loginSchema,
  registerSchema,
} from "./auth.controller";
import { validate } from "@/core/middlewares/validate";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);

export default router;
