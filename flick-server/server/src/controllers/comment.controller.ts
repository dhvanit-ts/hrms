import { Request, Response } from "express";
import { CommentModel } from "../models/comment.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import handleError from "../utils/HandleError.js";
import VoteModel from "../models/vote.model.js";
import { toObjectId } from "../utils/toObject.js";
import { logEvent } from "../services/log.service.js";
import NotificationService from "../services/notification.service.js";

const notificationService = new NotificationService();

export const getCommentsByPostId = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    if (!postId) throw new ApiError(400, "Post ID is required");

    const aggregationPipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          postId: new mongoose.Types.ObjectId(postId),
          isBanned: false,
        },
      },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // Lookup commentedBy user
      {
        $lookup: {
          from: "users",
          localField: "commentedBy",
          foreignField: "_id",
          as: "commentedBy",
        },
      },
      { $unwind: { path: "$commentedBy", preserveNullAndEmptyArrays: true } },

      // Lookup user's college
      {
        $lookup: {
          from: "colleges",
          localField: "commentedBy.college",
          foreignField: "_id",
          as: "commentedBy.college",
        },
      },
      {
        $unwind: {
          path: "$commentedBy.college",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup votes for this comment
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "commentId", // 🛠️ Fixed
          as: "votes",
        },
      },

      // Add upvoteCount and downvoteCount
      {
        $addFields: {
          upvoteCount: {
            $size: {
              $filter: {
                input: "$votes",
                as: "vote",
                cond: { $eq: ["$$vote.voteType", "upvote"] },
              },
            },
          },
          downvoteCount: {
            $size: {
              $filter: {
                input: "$votes",
                as: "vote",
                cond: { $eq: ["$$vote.voteType", "downvote"] },
              },
            },
          },
        },
      },

      // If userId exists, lookup userVote
      ...(req.user?._id
        ? [
            {
              $lookup: {
                from: "votes",
                let: {
                  commentId: "$_id",
                  userId: toObjectId(req.user._id),
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$commentId", "$$commentId"] }, // 🛠️ Fixed
                          { $eq: ["$userId", "$$userId"] },
                          { $eq: ["$type", "comment"] }, // 🛠️ Important!
                        ],
                      },
                    },
                  },
                  { $project: { _id: 0, voteType: 1 } },
                ],
                as: "userVote",
              },
            },
            {
              $addFields: {
                userVote: { $arrayElemAt: ["$userVote.voteType", 0] },
              },
            },
          ]
        : []),

      // Final project
      {
        $project: {
          _id: 1,
          content: 1,
          postId: 1,
          parentCommentId: 1,
          createdAt: 1,
          updatedAt: 1,
          isBanned: 1,
          upvoteCount: 1,
          downvoteCount: 1,
          userVote: 1,
          commentedBy: {
            _id: 1,
            username: 1,
            branch: 1,
            college: {
              _id: 1,
              profile: 1,
              name: 1,
            },
          },
        },
      },
    ];

    const comments = await CommentModel.aggregate(aggregationPipeline);

    const totalComments = await CommentModel.countDocuments({ postId });

    res.status(200).json({
      comments,
      meta: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching comments",
      "GET_COMMENTS_ERROR"
    );
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, parentCommentId } = req.body;
    const postId = req.params.postId;

    if (!content || !postId) throw new ApiError(400, "All fields are required");
    if (!req.user || !req.user?._id) throw new ApiError(401, "Unauthorized");
    
    const newComment = await CommentModel.create({
      content,
      postId: toObjectId(postId),
      commentedBy: toObjectId(req.user._id),
      parentCommentId: parentCommentId ? toObjectId(parentCommentId) : null,
    });

    notificationService.handleNotification({
      type: "replied",
      actorUsername: req.user.username,
      postId: postId,
      receiverId: req.user._id.toString(),
      content: content.substring(0, 100),
    });

    logEvent({
      action: "user_created_comment",
      platform: "web",
      metadata: {
        postId,
        parentCommentId,
        createdCommentId: newComment._id,
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res
      .status(201)
      .json({ message: "Comment created successfully.", comment: newComment });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error creating comment",
      "CREATE_COMMENT_ERROR"
    );
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const content = req.body.content?.trim();
    const { commentId } = req.params;

    if (!content)
      throw new ApiError(400, "Content is required and cannot be empty");
    if (!req.user || !req.user?._id) throw new ApiError(401, "Unauthorized");

    const updatedComment = await CommentModel.findByIdAndUpdate(
      toObjectId(commentId),
      { $set: { content: content.trim() } },
      { new: true }
    );

    if (!updatedComment) {
      throw new ApiError(
        404,
        "Comment not found or you are not authorized to update it"
      );
    }

    logEvent({
      action: "user_updated_comment",
      platform: "web",
      metadata: {
        updatedCommentId: commentId,
        updatedFields: { content: content ? 1 : 0 },
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      comment: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error updating comment",
      "UPDATE_COMMENT_ERROR"
    );
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    if (!commentId) throw new ApiError(400, "Comment ID is required");
    if (!req.user || !req.user?._id) throw new ApiError(401, "Unauthorized");

    const objectCommentId = toObjectId(commentId);

    const comment = await CommentModel.findById(objectCommentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (!comment.commentedBy.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await VoteModel.deleteMany({ commentId });
    await comment.deleteOne();

    logEvent({
      action: "user_deleted_comment",
      platform: "web",
      metadata: {
        deletedCommentId: commentId,
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error deleting comment",
      "DELETE_COMMENT_ERROR"
    );
  }
};
