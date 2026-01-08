import { HttpError } from "@/core/http";
import PostRepo from "./post.repo";

class PostService {
  async createPost(postData: {
    title: string;
    content: string;
    topic: string;
    postedBy: string;
  }) {
    const newPost = await PostRepo.Write.create({
      title: postData.title.trim(),
      content: postData.content.trim(),
      topic: postData.topic as any,
      postedBy: postData.postedBy,
    });

    return newPost;
  }

  async getPostById(id: string, userId?: string) {
    const post = await PostRepo.CachedRead.findByIdWithDetails(id, userId);
    if (!post) {
      throw HttpError.notFound("Post not found", {
        code: "POST_NOT_FOUND",
        meta: { source: "PostService.getPostById" },
        errors: [{ field: "id", message: "Post not found" }],
      });
    }
    return post;
  }

  async getPosts(options?: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt" | "views";
    sortOrder?: "asc" | "desc";
    topic?: string;
    collegeId?: string;
    branch?: string;
    userId?: string;
  }) {
    const posts = await PostRepo.CachedRead.findMany(options);
    const totalCount = await PostRepo.CachedRead.countAll({
      topic: options?.topic,
      collegeId: options?.collegeId,
      branch: options?.branch,
    });

    const page = options?.page || 1;
    const limit = options?.limit || 10;

    return {
      posts,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    };
  }

  async updatePost(
    id: string,
    userId: string,
    updates: {
      title?: string;
      content?: string;
      topic?: string;
    }
  ) {
    // First check if post exists and get author info
    const existingPost = await PostRepo.CachedRead.findById(id);
    if (!existingPost) {
      throw HttpError.notFound("Post not found", {
        code: "POST_NOT_FOUND",
        meta: { source: "PostService.updatePost" },
        errors: [{ field: "id", message: "Post not found" }],
      });
    }

    // Check if user is the author
    if (existingPost.postedBy !== userId) {
      throw HttpError.forbidden("You are not authorized to update this post", {
        code: "POST_UPDATE_FORBIDDEN",
        meta: { source: "PostService.updatePost" },
        errors: [{ field: "id", message: "You are not authorized to update this post" }],
      });
    }

    const cleanUpdates: any = {};
    if (updates.title) cleanUpdates.title = updates.title.trim();
    if (updates.content) cleanUpdates.content = updates.content.trim();
    if (updates.topic) cleanUpdates.topic = updates.topic;

    const updatedPost = await PostRepo.Write.updateById(id, cleanUpdates);
    return updatedPost;
  }

  async deletePost(id: string, userId: string) {
    // First check if post exists and get author info
    const existingPost = await PostRepo.CachedRead.findById(id);
    if (!existingPost) {
      throw HttpError.notFound("Post not found", {
        code: "POST_NOT_FOUND",
        meta: { source: "PostService.deletePost" },
        errors: [{ field: "id", message: "Post not found" }],
      });
    }

    // Check if user is the author
    if (existingPost.postedBy !== userId) {
      throw HttpError.forbidden("You are not authorized to delete this post", {
        code: "POST_DELETE_FORBIDDEN",
        meta: { source: "PostService.deletePost" },
        errors: [{ field: "id", message: "You are not authorized to delete this post" }],
      });
    }

    const deletedPost = await PostRepo.Write.deleteById(id);
    return deletedPost;
  }

  async incrementPostViews(id: string) {
    // Note: In a real implementation, you might want to add IP-based view tracking
    // to prevent multiple views from the same user/IP within a time window
    const updatedPost = await PostRepo.Write.incrementViews(id);
    return updatedPost;
  }

  async getPostsByCollege(collegeId: string, options?: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt" | "views";
    sortOrder?: "asc" | "desc";
    userId?: string;
  }) {
    return this.getPosts({
      ...options,
      collegeId,
    });
  }

  async getPostsByBranch(branch: string, options?: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt" | "views";
    sortOrder?: "asc" | "desc";
    userId?: string;
  }) {
    return this.getPosts({
      ...options,
      branch,
    });
  }
}

export default new PostService();