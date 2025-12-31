import { Router } from "express";
import UserController from "@/modules/user/user.controller";
import { pipelines } from "@/core/middlewares";

const router = Router();

// Public routes
router.post("/register", UserController.registerUser);
router.post("/initialize", UserController.initializeUser);
router.post("/auth/finalize", UserController.handleTempToken);
router.get("/google/callback", UserController.googleCallback);
router.post("/oauth", UserController.handleUserOAuth);

// Protected routes
router.use(pipelines.requireAuthenticatedUser);
router.get("/me", UserController.getUserData);
router.get("/id/:userId", UserController.getUserById);
router.get("/search/:query", UserController.searchUsers);

export default router;
