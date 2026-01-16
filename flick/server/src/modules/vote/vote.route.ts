import { Router } from "express";
import VoteController from "./vote.controller";
import { authenticate, blockSuspensionMiddleware } from "@/core/middlewares";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .post(blockSuspensionMiddleware, VoteController.createVote)
  .delete(VoteController.deleteVote)
  .patch(blockSuspensionMiddleware, VoteController.patchVote);

export default router;
