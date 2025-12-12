import { Response, Request } from "express";
import { PostModel } from "../models/post.model.js";
import handleError from "../utils/HandleError.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { Types } from "mongoose";
import { toObjectId } from "../utils/toObject.js";
import { CommentModel } from "../models/comment.model.js";
import VoteModel from "../models/vote.model.js";
import { logEvent } from "../services/log.service.js";
import PostTopic from "../types/PostTopic.js";
import PostService from "../services/post.service.js";
import UserService from "../services/user.service.js";

const postService = new PostService();
const userService = new UserService();

const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, topic } = req.body;
    if (!title || !content || !topic)
      throw new ApiError(400, "All fields are required");
    if (!PostTopic.includes(topic)) throw new ApiError(400, "Topic is invalid");
    if (!req.user?._id) throw new ApiError(401, "Unauthorized");

    const {
      allowed,
      reasons: [msg],
    } = await postService.validatePost(content);

    if (!allowed)
      throw new ApiError(400, `Your post was blocked because ${msg}.`);

    const user = await userService.getUserByIdAndPopulate<{
      _id: Types.ObjectId;
      username: string;
      branch: string;
      isBlocked: boolean;
      suspension: {
        ends: Date | null;
        reason: string | null;
        howManyTimes: number;
      };
      college: {
        _id: Types.ObjectId;
        name: string;
        profile: string;
      };
    }>(req.user._id, {
      select: ["_id", "username", "branch", "college"],
      populate: [{ path: "college", select: "_id name profile" }],
    });

    if (!user || !user.college) throw new ApiError(404, "User not found");

    const createdPost = await postService.create({
      title,
      content,
      topic,
      postedBy: toObjectId(req.user._id),
    });

    if (!createdPost) {
      throw new ApiError(500, "Failed to create post in database");
    }

    const data = {
      _id: createdPost._id,
      title: createdPost.title,
      content: createdPost.content,
      topic: createdPost.topic,
      postedBy: {
        _id: user._id,
        username: user.username,
        college: {
          _id: user.college._id,
          name: user.college.name,
          profile: user.college.profile,
        },
        branch: user.branch,
      },
      views: createdPost.views,
      createdAt: createdPost.createdAt,
      upvoteCount: 0,
      downvoteCount: 0,
    };

    logEvent({
      req,
      action: "user_created_post",
      platform: "web",
      metadata: {
        createdPostId: createdPost._id,
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      post: data,
      message: "Post created successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error creating post",
      "CREATE_POST_ERROR"
    );
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const { postId } = req.params;

    if (!postId) throw new ApiError(400, "Post id is required");
    if (!title && !content)
      throw new ApiError(400, "Title or content is required");

    if (!req.user || !req.user?._id) throw new ApiError(401, "Unauthorized");

    const updateFields: Partial<Record<string, any>> = {};
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;

    const response = await postService.update(toObjectId(postId), updateFields);
    if (!response) throw new ApiError(404, "Post not found");

    logEvent({
      req,
      action: "user_updated_post",
      platform: "web",
      metadata: {
        updatedPostId: response._id,
        updatedFields: { title: title ? 1 : 0, content: content ? 1 : 0 },
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      post: response,
      message: "Post updated successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error updating post",
      "UPDATE_POST_ERROR"
    );
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!postId) throw new ApiError(400, "Post ID is required");

    if (!req.user || !req.user?._id) throw new ApiError(401, "Unauthorized");

    const objectPostId = toObjectId(postId);

    const post = await PostModel.findById(objectPostId).select("_id");
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const commentIds = (
      await CommentModel.find({ postId: objectPostId }, { _id: 1 })
    ).map((c) => c._id);

    if (commentIds.length > 0) {
      await VoteModel.deleteMany({
        $or: [{ commentId: { $in: commentIds } }, { postId: objectPostId }],
      });
    } else {
      await VoteModel.deleteMany({ postId: objectPostId });
    }

    await CommentModel.deleteMany({ postId: objectPostId });

    await post.deleteOne();

    logEvent({
      req,
      action: "user_deleted_post",
      platform: "web",
      metadata: {
        deletedPostId: post._id,
      },
      sessionId: req.sessionId,
      userId: req.user._id.toString(),
    });

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    handleError(error, res, "Error deleting post", "DELETE_POST_ERROR");
  }
};

const getPostsForFeed = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await postService.findPostsAndPopulate({
      page,
      limit,
      userId: req.user?._id || null,
    });

    res.status(200).json({
      posts,
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting posts",
      "GET_POSTS_ERROR"
    );
  }
};

const getPostsByCollege = async (req: Request, res: Response) => {
  try {
    const college = req.params.collegeId;
    if (!college) throw new ApiError(400, "College ID is required");

    const posts = await postService.getPostsByCollege(college);

    if (!posts || posts.length === 0) {
      throw new ApiError(404, "No posts found for this college");
    }

    res.status(200).json({ posts });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting posts",
      "GET_POSTS_ERROR"
    );
  }
};

const getPostsByFilter = async (req: Request, res: Response) => {
  try {
    const branch = req.query.branch as string;
    const topic = req.query.topic as string;
    if (!branch && !topic)
      throw new ApiError(400, "Branch or Topic is required");

    let posts = null;

    if (topic) {
      const processedTopic = topic.toUpperCase().replace("_", " / ").replace("+", " ");
      posts = await postService.findPostsAndPopulate({
        limit: 10,
        page: 1,
        filters: { topic: processedTopic },
      });
    } else {
      const processedBranch = branch.replace("+", " ").toUpperCase();
      posts = await postService.getPostsByBranch(processedBranch);
    }

    if (!posts || posts.length === 0) {
      throw new ApiError(404, "No posts found for this filter");
    }

    res.status(200).json({ posts });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting posts",
      "GET_POSTS_ERROR"
    );
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid post ID.");
    }

    const posts = await postService.getPostByIdAndPopulate({
      postId: id,
      userId: req.user?._id || null,
    });

    if (!posts || posts.length === 0) {
      throw new ApiError(404, "Post not found");
    }

    res.status(200).json({ post: posts[0] });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching post",
      "GET_POST_ERROR"
    );
  }
};

const IncrementView = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!postId) throw new ApiError(400, "Post ID is required");

    await postService.incrementView(toObjectId(postId), req);

    res.status(200).json({ message: "View processed" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error incrementing view",
      "INCREMENT_VIEW_ERROR"
    );
  }
};

export {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPostsByCollege,
  getPostsByFilter,
  getPostsForFeed,
  IncrementView,
};
