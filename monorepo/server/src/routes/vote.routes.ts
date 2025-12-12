import { Router } from "express";
import {
  createVote,
  deleteVote,
  patchVote,
} from "../controllers/vote.controller.js";
import {
  blockSuspensionMiddleware,
  verifyUserJWT,
} from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyUserJWT, blockSuspensionMiddleware, createVote)
  .delete(verifyUserJWT, deleteVote)
  .patch(verifyUserJWT, blockSuspensionMiddleware, patchVote);

export default router;
