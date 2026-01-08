import { Request } from "express";
import { AsyncHandler, HttpResponse } from "@/core/http";
import commentService from "./comment.service";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";
import * as commentSchemas from "./comment.schema";
import { validateRequest } from "@/core/middlewares";

class CommentController {
  static getCommentsByPostId = [
    validateRequest(commentSchemas.postIdSchema, "params"),
    validateRequest(commentSchemas.getCommentsQuerySchema, "query"),
    this.getCommentsByPostIdHandler
  ]

  @AsyncHandler()
  private static async getCommentsByPostIdHandler(req: Request) {
    const { postId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query as {
      page?: number;
      limit?: number;
      sortBy?: "createdAt" | "updatedAt";
      sortOrder?: "asc" | "desc";
    };

    const userId = req.user?.id;

    const result = await commentService.getCommentsByPostId(postId, {
      page,
      limit,
      sortBy,
      sortOrder,
      userId,
    });

    return HttpResponse.ok("Comment retrieved successfully", result);
  }

  static createComment = [
    validateRequest(commentSchemas.postIdSchema, 'params'),
    validateRequest(commentSchemas.createCommentSchema),
    this.createCommentHandler
  ]

  @AsyncHandler()
  private static async createCommentHandler(req: Request) {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;
    const userId = req.user.id;

    const newComment = await commentService.createComment({
      content,
      postId,
      commentedBy: userId,
      parentCommentId,
    });

    return HttpResponse.created("Comment created successfully", { comment: newComment });
  }

  static updateComment = [
    validateRequest(commentSchemas.commentIdSchema, "params"),
    validateRequest(commentSchemas.updateCommentSchema),
    this.updateCommentHandler
  ]

  @AsyncHandler()
  private static async updateCommentHandler(req: Request) {
    const { content } = req.body;
    const { commentId } = req.params;
    const userId = req.user.id;

    const updatedComment = await commentService.updateComment(commentId, userId, content);

    return HttpResponse.ok("Comment updated successfully", { comment: updatedComment });
  }

  static deleteComment = withParamsValidation(commentSchemas.commentIdSchema, this.deleteCommentHandler)

  @AsyncHandler()
  private static async deleteCommentHandler(req: Request) {
    const { commentId } = req.params;
    const userId = req.user.id;

    await commentService.deleteComment(commentId, userId);

    return HttpResponse.ok("Comment deleted successfully")
  }

  static getCommentById = withParamsValidation(commentSchemas.commentIdSchema, this.getCommentByIdHandler)

  @AsyncHandler()
  private static async getCommentByIdHandler(req: Request) {
    const { commentId } = req.params;

    const comment = await commentService.getCommentById(commentId);

    return HttpResponse.ok("Comments retrieved successfully", { comment });
  }
}

export default CommentController;