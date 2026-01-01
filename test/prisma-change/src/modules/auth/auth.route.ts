import { Router } from "express";
import AuthController from "@/modules/auth/auth.controller";
import { ensureRatelimit, pipelines } from "@/core/middlewares";

const router = Router();

// Public routes
router.post("/login", AuthController.loginUser);
router.post("/refresh", AuthController.refreshAccessToken);
router.post("/otp/send", AuthController.sendOtp);
router.post("/otp/verify", AuthController.verifyOtp);

// Protected routes
router.use(ensureRatelimit.auth)
router.use(pipelines.requireAuthenticatedUser);
router.post("/logout", AuthController.logoutUser);

export default router;
