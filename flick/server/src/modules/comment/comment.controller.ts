import { Request } from "express";
import { Controller, HttpResponse } from "@/core/http";
import commentService from "./comment.service";
import * as commentSchemas from "./comment.schema";
import recordAudit from "@/lib/record-audit";

@Controller()
class CommentController {
  static async createComment(req: Request) {
    const { content, parentCommentId } = commentSchemas.CreateCommentSchema.parse(req.body);
    const { postId } = commentSchemas.PostIdSchema.parse(req.params);
    const userId = req.user.id;

    const newComment = await commentService.createComment({
      content,
      postId,
      commentedBy: userId,
      parentCommentId,
    });

    return HttpResponse.created("Comment created successfully", { comment: newComment });
  }

  static async updateComment(req: Request) {
    const { content } = commentSchemas.UpdateCommentSchema.parse(req.body);
    const { commentId } = commentSchemas.CommentIdSchema.parse(req.params);
    const userId = req.user.id;

    const updatedComment = await commentService.updateComment(commentId, userId, content);

    return HttpResponse.ok("Comment updated successfully", { comment: updatedComment });
  }

  static async deleteComment(req: Request) {
    const { commentId } = commentSchemas.CommentIdSchema.parse(req.params);
    const userId = req.user.id;

    await commentService.deleteComment(commentId, userId);
    return HttpResponse.ok("Comment deleted successfully")
  }

  static async getCommentsByPostId(req: Request) {
    const { postId } = commentSchemas.PostIdSchema.parse(req.params);
    const { page, limit, sortBy, sortOrder } = commentSchemas.GetCommentsQuerySchema.parse(req.query)

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

  static async getCommentById(req: Request) {
    const { commentId } = commentSchemas.CommentIdSchema.parse(req.params);

    const comment = await commentService.getCommentById(commentId);
    return HttpResponse.ok("Comments retrieved successfully", { comment });
  }
}

export default CommentController;