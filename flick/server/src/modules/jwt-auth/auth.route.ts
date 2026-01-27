import { Router } from "express";
import AuthController from "@/modules/auth/auth.controller";
import { authenticate, ensureRatelimit } from "@/core/middlewares";

const router = Router();

router.use(ensureRatelimit.auth);

router.post("/login", AuthController.loginUser);
router.post("/refresh", AuthController.refreshAccessToken);
router.post("/otp/send", AuthController.sendOtp);
router.post("/otp/verify", AuthController.verifyOtp);

// Protected routes
router.use(authenticate);

router.post("/logout", AuthController.logoutUser);

export default router;
