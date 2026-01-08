import { Request } from "express";
import { AsyncHandler, HttpResponse } from "@/core/http";
import postService from "./post.service";
import * as postSchemas from "./post.schema";
import { withBodyValidation, withQueryValidation, withParamsValidation } from "@/lib/validation";
import { validateRequest } from "@/core/middlewares";

type FilterType = {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "views";
  sortOrder?: "asc" | "desc";
};

class PostController {
  static createPost = withBodyValidation(postSchemas.createPostSchema, this.createPostHandler)

  @AsyncHandler()
  private static async createPostHandler(req: Request) {
    const { title, content, topic } = req.body;
    const userId = req.user.id;

    const newPost = await postService.createPost({
      title,
      content,
      topic,
      postedBy: userId,
    });

    return HttpResponse.created("Post created successfully", { post: newPost });
  }

  static getPosts = withQueryValidation(postSchemas.getPostsQuerySchema, this.getPostsHandler)

  @AsyncHandler()
  private static async getPostsHandler(req: Request) {
    const { page, limit, sortBy, sortOrder, topic, collegeId, branch } = req.query as FilterType & {
      topic?: string;
      collegeId?: string;
      branch?: string;
    };

    const userId = req.user?.id;

    const result = await postService.getPosts({
      page,
      limit,
      sortBy,
      sortOrder,
      topic,
      collegeId,
      branch,
      userId,
    });

    return HttpResponse.ok("Posts retrieved successfully", result);
  }

  static getPostById = withParamsValidation(postSchemas.postIdSchema, this.getPostByIdHandler)

  @AsyncHandler()
  private static async getPostByIdHandler(req: Request) {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await postService.getPostById(id, userId);

    return HttpResponse.ok("Post retrieved successfully", {
      post,
    });
  }

  static updatePost = [
    validateRequest(postSchemas.postIdSchema, "params"),
    validateRequest(postSchemas.updatePostSchema),
    this.updatePostHandler
  ]

  @AsyncHandler()
  private static async updatePostHandler(req: Request) {
    const { id } = req.params;
    const { title, content, topic } = req.body;
    const userId = req.user.id;

    const updatedPost = await postService.updatePost(id, userId, {
      title,
      content,
      topic,
    });

    return HttpResponse.ok("Post updated successfully", { post: updatedPost });
  }

  static deletePost = withParamsValidation(postSchemas.postIdSchema, this.deletePostHandler)

  @AsyncHandler()
  private static async deletePostHandler(req: Request) {
    const { id } = req.params;
    const userId = req.user.id;

    await postService.deletePost(id, userId);

    return HttpResponse.ok("Post deleted successfully");
  }

  static incrementPostViews = withParamsValidation(postSchemas.postIdSchema, this.incrementPostViewsHandler)

  @AsyncHandler()
  private static async incrementPostViewsHandler(req: Request) {
    const { id } = req.params;

    await postService.incrementPostViews(id);

    return HttpResponse.ok("Post view incremented")
  }

  static getPostsByCollege = [
    validateRequest(postSchemas.collegeIdSchema, "params"),
    validateRequest(postSchemas.getPostsQuerySchema),
    this.getPostsByCollegeHandler
  ]

  @AsyncHandler()
  private static async getPostsByCollegeHandler(req: Request) {
    const { collegeId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query as FilterType

    const userId = req.user?.id;

    const result = await postService.getPostsByCollege(collegeId, {
      page,
      limit,
      sortBy,
      sortOrder,
      userId,
    });

    return HttpResponse.ok("Posts retrieved successfully by college", result);
  }

  static getPostsByBranch = [
    validateRequest(postSchemas.branchSchema, "params"),
    validateRequest(postSchemas.getPostsQuerySchema),
    this.getPostsByBranchHandler
  ]

  @AsyncHandler()
  private static async getPostsByBranchHandler(req: Request) {
    const { branch } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query as FilterType

    const userId = req.user?.id;

    const result = await postService.getPostsByBranch(branch, {
      page,
      limit,
      sortBy,
      sortOrder,
      userId,
    });

    return HttpResponse.ok("Posts retrieved successfully by branch", result);
  }
}

export default PostController;