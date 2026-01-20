import { HttpError } from "@/core/http";
import AuthRepo from "@/modules/auth/auth.repo";
import logger from "@/core/logger";

class UserService {
  getUserByIdService = async (userId: string) => {
    logger.info("Fetching user by ID", { userId });
    
    const user = await AuthRepo.CachedRead.findById(userId);

    if (!user) {
      logger.warn("User not found", { userId });
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.getUserByIdService" },
      });
    }

    logger.info("User retrieved successfully", { userId, username: user.username });
    return user;
  };

  searchUsersService = async (query: string) => {
    logger.info("Searching users", { query });
    
    const users = await AuthRepo.CachedRead.searchUsers(query);

    logger.info("User search completed", { query, resultCount: users.length });
    return users;
  };
}

export default new UserService();
