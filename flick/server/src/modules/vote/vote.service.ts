import VoteRepo from "./vote.repo";
import { HttpError, HttpResponse } from "@/core/http";
import PostRepo from "../post/post.repo";
import CommentRepo from "../comment/comment.repo";
import AuthRepo from "../auth/auth.repo";
import { runTransaction } from "@/infra/db/transactions";
import recordAudit from "@/lib/record-audit";
import { AuditAction } from "@/shared/constants/audit/actions";

class VoteService {
  static async createVote(userId: string, targetType: "post" | "comment", targetId: string, voteType: "upvote" | "downvote") {
    // if (!voteType || !targetId || !targetType) {
    //   throw new ApiError(
    //     400,
    //     "Vote type, targetId, and targetType are required"
    //   );
    // }

    // if (!["upvote", "downvote"].includes(voteType)) {
    //   throw new ApiError(400, "Invalid vote type");
    // }

    // if (!["post", "comment"].includes(targetType)) {
    //   throw new ApiError(400, "Invalid target type");
    // }

    const doesTargetedPost = targetType === "post"
    const isUpvoted = voteType === "upvote"

    return await runTransaction(async tx => {
      const createdVote = await VoteRepo.Write.create({
        postId: doesTargetedPost ? targetId : null,
        commentId: !doesTargetedPost ? targetId : null,
        userId,
        voteType,
        targetType,
      }, tx);

      if (!createdVote) throw HttpError.internal("Failed to create vote");

      const TargetRepo = doesTargetedPost ? PostRepo : CommentRepo
      const target = await TargetRepo.CachedRead.findAuthorId(targetId, tx);

      if (!target) throw HttpError.notFound(`${targetType} not found`);

      const ownerId = target.postedBy;
      const karmaChange = isUpvoted ? 1 : -1;

      await AuthRepo.Write.update(karmaChange, ownerId, tx);

      // if (isUpvoted) {
      //   notificationService.handleNotification({
      //     type: doesTargetedPost ? "upvoted_post" : "upvoted_comment",
      //     actorUsername: req.user.username,
      //     postId: targetId,
      //     receiverId: ownerId,
      //   });
      // }

      const action: AuditAction = `user:${voteType}d:${targetType}`;

      await recordAudit({
        action,
        entityType: "vote",
        entityId: createdVote.id,
        after: { id: createdVote.id, voteType: createdVote.voteType },
        metadata: {
          targetId,
          targetType,
        },
      });

      return createdVote
    })
  }

  static async patchVote(userId: string, targetType: "post" | "comment", targetId: string, voteType: "upvote" | "downvote") {
    const doesTargetedPost = targetType === "post"

    const txResponse = await runTransaction(async tx => {
      const existingVote = await VoteRepo.CachedRead.findByUserAndTarget(userId, targetId, doesTargetedPost, tx);
      if (!existingVote) throw HttpError.notFound("Vote not found to patch");

      // If voteType is the same, no need to patch
      if (existingVote.voteType === voteType) {
        return { message: "Vote already of the requested type", vote: existingVote, before: existingVote.voteType };
      }

      const updatedVote = await VoteRepo.Write.update(existingVote.id, { voteType }, tx)

      const TargetRepo = doesTargetedPost ? PostRepo : CommentRepo
      const target = await TargetRepo.CachedRead.findAuthorId(targetId, tx)

      if (!target) throw HttpError.notFound(`${targetType} not found`);

      const ownerId = target.postedBy;
      const karmaChange = (voteType === "upvote" ? 1 : -1) * 2;

      await AuthRepo.Write.update(karmaChange, ownerId, tx)

      return { message: "Vote patched successfully to the requested type", vote: updatedVote, before: existingVote.voteType }
    })

    const action: AuditAction = `user:switched:vote:on:${targetType}`;

    await recordAudit({
      action,
      entityType: "vote",
      entityId: txResponse.vote.id,
      before: { voteType: txResponse.before },
      after: { voteType: txResponse.vote.voteType },
      metadata: {
        targetId,
        targetType,
      },
    });

    return HttpResponse.ok(txResponse.message, txResponse.vote)
  }

  static async delete(userId: string, targetId: string, targetType: "post" | "comment") {
    const doesTargetedPost = targetType === "post"

    const deletedVoteId = await runTransaction(async tx => {
      const deletedVote = await VoteRepo.Write.deleteByUserAndTarget(userId, targetId, doesTargetedPost, tx);

      if (!deletedVote) {
        throw HttpError.notFound("Vote not found");
      }

      const TargetRepo = doesTargetedPost ? PostRepo : CommentRepo
      const target = await TargetRepo.CachedRead.findAuthorId(targetId, tx)

      if (!target) throw HttpError.notFound(`${targetType} not found`);

      const ownerId = target.postedBy;
      const karmaChange = deletedVote.voteType === "upvote" ? -1 : 1;

      await AuthRepo.Write.update(karmaChange, ownerId, tx)

      return deletedVote.id
    })

    const action: AuditAction = `user:deleted:vote:on:${targetType}`;

    await recordAudit({
      action,
      entityType: "vote",
      before: { id: deletedVoteId },
      metadata: {
        targetId,
        targetType,
      },
    });

    return deletedVoteId
  }
}

export default VoteService