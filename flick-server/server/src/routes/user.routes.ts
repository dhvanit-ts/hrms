import { RequestHandler, Router } from "express";
import {
  registerUser,
  initializeUser,
  getUserData,
  loginUser,
  logoutUser,
  refreshAccessToken,
  sendOtp,
  verifyOtp,
  heartbeat,
  acceptTerms,
  initializeForgotPassword,
  forgotPassword,
  terminateAllSessions,
  getUserProfile,
  googleCallback,
  handleUserOAuth,
} from "../controllers/user.controller.js";
import { verifyUserJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/google/callback").get(googleCallback);
router.route("/oauth").post(handleUserOAuth);
router.route("/register").post(registerUser);
router.route("/initialize").post(initializeUser);
router.route("/me").get(verifyUserJWT, getUserData);
router.route("/profile").get(verifyUserJWT, getUserProfile);
router.route("/reset-password/init").post(initializeForgotPassword);
router.route("/reset-password").post(forgotPassword);
router.route("/devices/terminate").post(verifyUserJWT, terminateAllSessions);
router.route("/accept-terms").post(verifyUserJWT, acceptTerms);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUserJWT, logoutUser);
router.route("/heartbeat").patch(heartbeat as RequestHandler);
router.route("/refresh").post(refreshAccessToken);
router.route("/otp/send").post(sendOtp);
router.route("/otp/verify").post(verifyOtp);

export default router;
