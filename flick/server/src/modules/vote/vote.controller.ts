import { Request, Response } from "express";
import { AsyncHandler } from "@/core/http/controller.js";
import HttpResponse from "@/core/http/response.js";
import VoteService from "./vote.service.js";
import HttpError from "@/core/http/error.js";
import * as voteSchemas from "./vote.schema"
import { withBodyValidation } from "@/lib/validation.js";

class VoteController {
  static createVote = withBodyValidation(voteSchemas.insertVoteSchema, this.createVoteHandler)

  @AsyncHandler()
  private static async createVoteHandler(req: Request, res: Response) {
    const userId = req.user.id
    const { voteType, targetId, targetType } = req.body;

    const vote = await VoteService.createVote(userId, targetType, targetId, voteType)
    return HttpResponse.created("Vote created successfully", vote);
  };

  static deleteVote = withBodyValidation(voteSchemas.deleteVoteSchema, this.deleteVoteHandler)

  private static async deleteVoteHandler(req: Request, res: Response) {
    const { targetId, targetType } = req.body;
    const userId = req.user.id

    const deletedVoteId = await VoteService.delete(userId, targetId, targetType)
    return HttpResponse.ok("Vote deleted and karma updated successfully", { deletedVoteId });
  };

  static patchVote = withBodyValidation(voteSchemas.insertVoteSchema, this.patchVoteHandler)

  private static async patchVoteHandler(req: Request, res: Response) {
    const { voteType, targetId, targetType } = req.body;

    const userId = req.user.id;
    if (!userId) throw HttpError.unauthorized();

    return await VoteService.patchVote(userId, targetType, targetId, voteType)
  };
};

export default VoteController