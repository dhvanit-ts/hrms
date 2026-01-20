import { HttpError } from "@/core/http";
import { PostAdapter, CommentAdapter } from "@/infra/db/adapters";
import ContentReportService from "./content-report.service.js";
import logger from "@/core/logger";

class ContentModerationService {
  static async banPost(postId: string) {
    logger.info("Banning post", { postId });
    
    const post = await PostAdapter.findById(postId);
    if (!post) {
      logger.warn("Post not found for banning", { postId });
      throw HttpError.notFound("Post not found");
    }

    if (post.isBanned) {
      logger.warn("Post already banned", { postId });
      throw HttpError.badRequest("Post is already banned");
    }

    const updatedPost = await PostAdapter.updateById(postId, { isBanned: true });
    if (!updatedPost) {
      logger.error("Failed to ban post", { postId });
      throw HttpError.internal("Failed to ban post");
    }

    // Update related reports to resolved
    await ContentReportService.updateReportsByTargetId(parseInt(postId), "Post", "resolved");

    logger.info("Post banned successfully", { postId, title: updatedPost.title });

    return {
      success: true,
      message: "Post banned successfully",
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        isBanned: updatedPost.isBanned,
      }
    };
  }

  static async unbanPost(postId: string) {
    const post = await PostAdapter.findById(postId);
    if (!post) {
      throw HttpError.notFound("Post not found");
    }

    if (!post.isBanned) {
      throw HttpError.badRequest("Post is not banned");
    }

    const updatedPost = await PostAdapter.updateById(postId, { isBanned: false });
    if (!updatedPost) {
      throw HttpError.internal("Failed to unban post");
    }

    return {
      success: true,
      message: "Post unbanned successfully",
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        isBanned: updatedPost.isBanned,
      }
    };
  }

  static async shadowBanPost(postId: string) {
    const post = await PostAdapter.findById(postId);
    if (!post) {
      throw HttpError.notFound("Post not found");
    }

    if (post.isShadowBanned) {
      throw HttpError.badRequest("Post is already shadow banned");
    }

    const updatedPost = await PostAdapter.updateById(postId, { isShadowBanned: true });
    if (!updatedPost) {
      throw HttpError.internal("Failed to shadow ban post");
    }

    // Update related reports to resolved
    await ContentReportService.updateReportsByTargetId(parseInt(postId), "Post", "resolved");

    return {
      success: true,
      message: "Post shadow banned successfully",
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        isShadowBanned: updatedPost.isShadowBanned,
      }
    };
  }

  static async shadowUnbanPost(postId: string) {
    const post = await PostAdapter.findById(postId);
    if (!post) {
      throw HttpError.notFound("Post not found");
    }

    if (!post.isShadowBanned) {
      throw HttpError.badRequest("Post is not shadow banned");
    }

    const updatedPost = await PostAdapter.updateById(postId, { isShadowBanned: false });
    if (!updatedPost) {
      throw HttpError.internal("Failed to shadow unban post");
    }

    return {
      success: true,
      message: "Post shadow unbanned successfully",
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        isShadowBanned: updatedPost.isShadowBanned,
      }
    };
  }

  static async banComment(commentId: string) {
    const comment = await CommentAdapter.findById(commentId);
    if (!comment) {
      throw HttpError.notFound("Comment not found");
    }

    if (comment.isBanned) {
      throw HttpError.badRequest("Comment is already banned");
    }

    const updatedComment = await CommentAdapter.updateById(commentId, { isBanned: true });
    if (!updatedComment) {
      throw HttpError.internal("Failed to ban comment");
    }

    // Update related reports to resolved
    await ContentReportService.updateReportsByTargetId(parseInt(commentId), "Comment", "resolved");

    return {
      success: true,
      message: "Comment banned successfully",
      comment: {
        id: updatedComment.id,
        content: updatedComment.content.substring(0, 50) + "...",
        isBanned: updatedComment.isBanned,
      }
    };
  }

  static async unbanComment(commentId: string) {
    const comment = await CommentAdapter.findById(commentId);
    if (!comment) {
      throw HttpError.notFound("Comment not found");
    }

    if (!comment.isBanned) {
      throw HttpError.badRequest("Comment is not banned");
    }

    const updatedComment = await CommentAdapter.updateById(commentId, { isBanned: false });
    if (!updatedComment) {
      throw HttpError.internal("Failed to unban comment");
    }

    const content = updatedComment.content
    const substringedContent = content.length() > 50 ? content.substring(0, 50) + "..." : content

    return {
      success: true,
      message: "Comment unbanned successfully",
      comment: {
        id: updatedComment.id,
        content: substringedContent,
        isBanned: updatedComment.isBanned,
      }
    };
  }

  static async moderateContent(
    targetId: string,
    type: "Post" | "Comment",
    action: "ban" | "unban" | "shadowBan" | "shadowUnban"
  ) {
    switch (type) {
      case "Post":
        switch (action) {
          case "ban":
            return await this.banPost(targetId);
          case "unban":
            return await this.unbanPost(targetId);
          case "shadowBan":
            return await this.shadowBanPost(targetId);
          case "shadowUnban":
            return await this.shadowUnbanPost(targetId);
          default:
            throw HttpError.badRequest("Invalid action for post");
        }
      case "Comment":
        switch (action) {
          case "ban":
            return await this.banComment(targetId);
          case "unban":
            return await this.unbanComment(targetId);
          case "shadowBan":
            throw HttpError.badRequest("Shadow ban not supported for comments");
          case "shadowUnban":
            throw HttpError.badRequest("Shadow unban not supported for comments");
          default:
            throw HttpError.badRequest("Invalid action for comment");
        }
      default:
        throw HttpError.badRequest("Invalid content type");
    }
  }
}

export default ContentModerationService;