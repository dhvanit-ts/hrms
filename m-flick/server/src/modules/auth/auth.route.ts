import { Router } from "express";
import AuthController from "@/modules/auth/auth.controller";
import { verifyUserJWT, validate } from "@/core/middlewares";
import * as authSchemas from "@/modules/auth/auth.schema";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and management
 */

// Public routes

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/loginSchema'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       404:
 *         description: User doesn't exists
 *       400:
 *         description: Bad Request - Invalid input, Password not set, or Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidInput:
 *                 summary: Invalid input
 *                 value:
 *                   message: Invalid input data
 *               passwordNotSet:
 *                 summary: Password not set
 *                 value:
 *                   message: Password not set for this account
 *               invalidPassword:
 *                 summary: Invalid password
 *                 value:
 *                   message: Password incorrect
 */
router.post(
  "/login",
  validate(authSchemas.loginSchema),
  AuthController.loginUser
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/refreshSchema'
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       400:
 *         description: Invalid input
 */
router.post("/refresh", AuthController.refreshAccessToken);

/**
 * @openapi
 * /api/v1/auth/otp/send:
 *   post:
 *     summary: Send OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/otpSchema'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/otp/send",
  validate(authSchemas.otpSchema),
  AuthController.sendOtp
);

/**
 * @openapi
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/verifyOtpSchema'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/otp/verify",
  validate(authSchemas.verifyOtpSchema),
  AuthController.verifyOtp
);

// Protected routes
router.use(verifyUserJWT);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       404:
 *         description: User doesn't exists
 */
router.post("/logout", AuthController.logoutUser);

export default router;
