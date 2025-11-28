import { Router } from "express";
import AuthController from "@/modules/auth/auth.controller";
import { verifyUserJWT } from "@/core/middlewares/auth.middleware";
import { validate } from "@/core/middlewares/validate.middleware";
import * as authSchemas from "@/modules/auth/auth.schema";

const router = Router();

router.post(
  "/login",
  validate(authSchemas.loginSchema),
  AuthController.loginUser
);
router.post("/refresh", AuthController.refreshAccessToken);
router.post(
  "/otp/send",
  validate(authSchemas.otpSchema),
  AuthController.sendOtp
);
router.post(
  "/otp/verify",
  validate(authSchemas.verifyOtpSchema),
  AuthController.verifyOtp
);

// Protected routes
router.use(verifyUserJWT);

router.post("/logout", AuthController.logoutUser);

export default router;
