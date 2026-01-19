import { Router } from "express";
import VoteController from "./vote.controller";
import { authenticate, blockSuspensionMiddleware, observeRequest } from "@/core/middlewares";

const router = Router();

router.use(authenticate);
router.use(observeRequest)

router
  .route("/")
  .post(blockSuspensionMiddleware, VoteController.createVote)
  .delete(VoteController.deleteVote)
  .patch(blockSuspensionMiddleware, VoteController.patchVote);

export default router;
