import { Router } from "express";
import {
  blockSuspensionMiddleware,
  verifyUserJWT,
} from "../middleware/auth.middleware.js";
import { createFeedback } from "../controllers/feedback.controller.js";

const router = Router();

router
  .route("/")
  .post(verifyUserJWT, blockSuspensionMiddleware, createFeedback);

export default router;
