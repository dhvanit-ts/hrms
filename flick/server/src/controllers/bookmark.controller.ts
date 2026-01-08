import { Request, Response } from "express";
import BookmarkModel from "../models/bookmark.model.js";
import handleError from "../utils/HandleError.js";
import { ApiError } from "../utils/ApiError.js";
import { PostModel } from "../models/post.model.js";
import { toObjectId } from "../utils/toObject.js";

// Create a bookmark
export const createBookmark = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { postId } = req.body;
    const userId = req.user._id;

    const existing = await BookmarkModel.findOne({ postId, userId });
    if (existing) throw new ApiError(409, "Bookmark already exists");

    const newBookmark = await BookmarkModel.create({ postId, userId });
    res.status(201).json({
      bookmark: newBookmark,
      success: true,
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error creating bookmark",
      "CREATE_BOOKMARK_ERROR"
    );
  }
};

// Get all bookmarks for a user
export const getUserBookmarkedPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const userId = req.user._id;

    const bookmarks = await BookmarkModel.find({ userId }).select("postId");
    const postIds = bookmarks.map((b) => b.postId);

    if (!postIds.length) throw new ApiError(404, "No bookmarks found");

    const aggregationPipeline: any[] = [
      {
        $match: {
          _id: { $in: postIds.map((id) => toObjectId(id)) },
          isBanned: false,
          isShadowBanned: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy",
        },
      },
      {
        $unwind: {
          path: "$postedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "colleges",
          localField: "postedBy.college",
          foreignField: "_id",
          as: "postedBy.college",
        },
      },
      {
        $unwind: {
          path: "$postedBy.college",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "postId",
          as: "votes",
        },
      },
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
      {
        $lookup: {
          from: "votes",
          let: {
            postId: "$_id",
            userId: toObjectId(req.user._id),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", "$$userId"] },
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
      {
        $project: {
          title: 1,
          content: 1,
          views: 1,
          createdAt: 1,
          upvoteCount: 1,
          downvoteCount: 1,
          userVote: 1,
          bookmarked: 1,
          topic: 1,
          postedBy: {
            _id: 1,
            username: 1,
            branch: 1,
            bookmarks: 1,
            college: {
              _id: 1,
              name: 1,
              profile: 1,
              email: 1,
            },
          },
        },
      },
    ];

    const posts = await PostModel.aggregate(aggregationPipeline);

    res.status(200).json({
      posts,
      count: posts.length,
      success: true,
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting bookmarked posts",
      "GET_BOOKMARKED_POSTS_AGGREGATION_ERROR"
    );
  }
};

// Delete a bookmark
export const deleteBookmark = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { postId } = req.params;
    const userId = req.user._id;

    if (!postId) throw new ApiError(400, "Post ID is required");

    const deleted = await BookmarkModel.findOneAndDelete({ postId, userId });

    if (!deleted) throw new ApiError(404, "Bookmark not found for this user");
    res.status(201).json({ message: "Bookmark deleted" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error deleting bookmark",
      "DELETE_BOOKMARK_ERROR"
    );
  }
};

// (Optional) Get one bookmark
export const getBookmark = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { postId } = req.params;
    const userId = req.user._id;

    const bookmark = await BookmarkModel.findOne({ postId, userId }).populate(
      "postId"
    );
    if (!bookmark) throw new ApiError(404, "Bookmark not found for this user");

    res.json({
      bookmark,
      success: true,
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting bookmark",
      "GET_BOOKMARK_ERROR"
    );
  }
};
