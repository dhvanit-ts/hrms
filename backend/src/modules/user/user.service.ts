import { ApiError } from "@/core/http";
import * as authRepo from "@/modules/auth/auth.repo";

class UserService {
  getUserByIdService = async (userId: string) => {
    const user = await authRepo.findById(userId);

    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.getUserByIdService" },
      });

    return user;
  };

  searchUsersService = async (query: string) => {
    const users = await authRepo.searchUsers(query);

    return users;
  };
}

export default new UserService();
