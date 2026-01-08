import { Router } from "express";
import {
  createVote,
  deleteVote,
  patchVote,
} from "./vote.controller";
import { authenticate, blockSuspensionMiddleware } from "@/core/middlewares/auth";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .post(blockSuspensionMiddleware, createVote)
  .delete(deleteVote)
  .patch(blockSuspensionMiddleware, patchVote);

export default router;
