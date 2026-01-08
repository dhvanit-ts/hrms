import { HttpError } from "@/core/http";
import CommentRepo from "./comment.repo";

class CommentService {
  async getCommentsByPostId(
    postId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: "createdAt" | "updatedAt";
      sortOrder?: "asc" | "desc";
      userId?: string;
    }
  ) {
    const comments = await CommentRepo.CachedRead.findByPostId(postId, options);
    const totalComments = await CommentRepo.CachedRead.countByPostId(postId);

    const page = options?.page || 1;
    const limit = options?.limit || 10;

    return {
      comments,
      meta: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
      },
    };
  }

  async createComment(commentData: {
    content: string;
    postId: string;
    commentedBy: string;
    parentCommentId?: string;
  }) {
    const newComment = await CommentRepo.Write.create({
      content: commentData.content.trim(),
      postId: commentData.postId,
      commentedBy: commentData.commentedBy,
      parentCommentId: commentData.parentCommentId || null,
    });

    return newComment;
  }

  async updateComment(commentId: string, userId: string, content: string) {
    // First check if comment exists and get author info
    const existingComment = await CommentRepo.CachedRead.findByIdWithAuthor(commentId);
    if (!existingComment) {
      throw HttpError.notFound("Comment not found", {
        code: "COMMENT_NOT_FOUND",
        meta: { source: "CommentService.updateComment" },
        errors: [{ field: "commentId", message: "Comment not found" }],
      });
    }

    // Check if user is the author
    if (existingComment.commentedBy !== userId) {
      throw HttpError.forbidden("You are not authorized to update this comment", {
        code: "COMMENT_UPDATE_FORBIDDEN",
        meta: { source: "CommentService.updateComment" },
        errors: [{ field: "commentId", message: "You are not authorized to update this comment" }],
      });
    }

    const updatedComment = await CommentRepo.Write.updateById(commentId, {
      content: content.trim(),
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    // First check if comment exists and get author info
    const existingComment = await CommentRepo.CachedRead.findByIdWithAuthor(commentId);
    if (!existingComment) {
      throw HttpError.notFound("Comment not found", {
        code: "COMMENT_NOT_FOUND",
        meta: { source: "CommentService.deleteComment" },
        errors: [{ field: "commentId", message: "Comment not found" }],
      });
    }

    // Check if user is the author
    if (existingComment.commentedBy !== userId) {
      throw HttpError.forbidden("You are not authorized to delete this comment", {
        code: "COMMENT_DELETE_FORBIDDEN",
        meta: { source: "CommentService.deleteComment" },
        errors: [{ field: "commentId", message: "You are not authorized to delete this comment" }],
      });
    }

    const deletedComment = await CommentRepo.Write.deleteById(commentId);
    return deletedComment;
  }

  async getCommentById(commentId: string) {
    const comment = await CommentRepo.CachedRead.findById(commentId);
    if (!comment) {
      throw HttpError.notFound("Comment not found", {
        code: "COMMENT_NOT_FOUND",
        meta: { source: "CommentService.getCommentById" },
        errors: [{ field: "commentId", message: "Comment not found" }],
      });
    }
    return comment;
  }
}

export default new CommentService();