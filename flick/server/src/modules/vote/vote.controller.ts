import { Request, Response } from "express";
import { Controller } from "@/core/http/controller.js";
import HttpResponse from "@/core/http/response.js";
import VoteService from "./vote.service.js";
import HttpError from "@/core/http/error.js";
import * as voteSchemas from "./vote.schema"

@Controller()
class VoteController {
  static async createVote(req: Request) {
    const userId = req.user.id
    const { voteType, targetId, targetType } = voteSchemas.InsertVoteSchema.parse(req.body);

    const vote = await VoteService.createVote(userId, targetType, targetId, voteType)
    return HttpResponse.created("Vote created successfully", vote);
  };

  static async deleteVote(req: Request) {
    const { targetId, targetType } = voteSchemas.DeleteVoteSchema.parse(req.body);
    const userId = req.user.id

    const deletedVoteId = await VoteService.delete(userId, targetId, targetType)
    return HttpResponse.ok("Vote deleted and karma updated successfully", { deletedVoteId });
  };

  static async patchVote(req: Request) {
    const { voteType, targetId, targetType } = voteSchemas.InsertVoteSchema.parse(req.body);

    const userId = req.user.id;
    if (!userId) throw HttpError.unauthorized();

    return await VoteService.patchVote(userId, targetType, targetId, voteType)
  };
};

export default VoteController