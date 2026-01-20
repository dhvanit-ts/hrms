import { HttpError } from "@/core/http";
import { UserAdapter } from "@/infra/db/adapters";
import logger from "@/core/logger";

class UserManagementService {
  static async blockUser(userId: string) {
    logger.info("Blocking user", { userId });
    
    const user = await UserAdapter.findById(userId);
    if (!user) {
      logger.warn("User not found for blocking", { userId });
      throw HttpError.notFound("User not found");
    }

    if (user.isBlocked) {
      logger.warn("User already blocked", { userId });
      throw HttpError.badRequest("User is already blocked");
    }

    const updatedUser = await UserAdapter.blockUser(userId);
    if (!updatedUser) {
      logger.error("Failed to block user", { userId });
      throw HttpError.internal("Failed to block user");
    }

    logger.info("User blocked successfully", { userId, username: updatedUser.username });

    return {
      success: true,
      message: "User blocked successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        isBlocked: updatedUser.isBlocked,
      }
    };
  }

  static async unblockUser(userId: string) {
    logger.info("Unblocking user", { userId });
    
    const user = await UserAdapter.findById(userId);
    if (!user) {
      logger.warn("User not found for unblocking", { userId });
      throw HttpError.notFound("User not found");
    }

    if (!user.isBlocked) {
      logger.warn("User not blocked", { userId });
      throw HttpError.badRequest("User is not blocked");
    }

    const updatedUser = await UserAdapter.unblockUser(userId);
    if (!updatedUser) {
      logger.error("Failed to unblock user", { userId });
      throw HttpError.internal("Failed to unblock user");
    }

    logger.info("User unblocked successfully", { userId, username: updatedUser.username });

    return {
      success: true,
      message: "User unblocked successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        isBlocked: updatedUser.isBlocked,
      }
    };
  }

  static async suspendUser(userId: string, suspensionData: {
    ends: Date;
    reason: string;
  }) {
    logger.info("Suspending user", { userId, suspensionEnds: suspensionData.ends, reason: suspensionData.reason });
    
    const user = await UserAdapter.findById(userId);
    if (!user) {
      logger.warn("User not found for suspension", { userId });
      throw HttpError.notFound("User not found");
    }

    // Check if suspension end date is in the future
    if (suspensionData.ends <= new Date()) {
      logger.warn("Invalid suspension end date", { userId, suspensionEnds: suspensionData.ends });
      throw HttpError.badRequest("Suspension end date must be in the future");
    }

    const updatedUser = await UserAdapter.suspendUser(userId, suspensionData);
    if (!updatedUser) {
      logger.error("Failed to suspend user", { userId });
      throw HttpError.internal("Failed to suspend user");
    }

    logger.info("User suspended successfully", { userId, username: updatedUser.username, suspensionEnds: suspensionData.ends });

    return {
      success: true,
      message: "User suspended successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        suspension: updatedUser.suspension,
      }
    };
  }

  static async getSuspensionStatus(userId: string) {
    const user = await UserAdapter.getSuspensionStatus(userId);
    if (!user) {
      throw HttpError.notFound("User not found");
    }

    return {
      success: true,
      suspension: user.suspension,
    };
  }

  static async getUsersByQuery(filters: {
    email?: string;
    username?: string;
  }) {
    if (!filters.email && !filters.username) {
      throw HttpError.badRequest("At least one filter (email or username) is required");
    }

    const users = await UserAdapter.findByQuery(filters);

    return {
      success: true,
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        // Don't expose email in search results for privacy
        isBlocked: user.isBlocked,
        suspension: user.suspension,
        college: user.college,
      }))
    };
  }

  static async getUserById(userId: string) {
    const user = await UserAdapter.findById(userId);
    if (!user) {
      throw HttpError.notFound("User not found");
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        isBlocked: user.isBlocked,
        suspension: user.suspension,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    };
  }
}

export default UserManagementService;