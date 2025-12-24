import { HttpError } from "@/core/http";
import * as authRepo from "@/modules/auth/auth.repo";

class UserService {
  static getUserByIdService = async (userId: string) => {
    const user = await authRepo.findById(userId);

    if (!user)
      throw HttpError.notFound("User doesn't exists", { code: "USER_NOT_FOUND", meta: { service: "authService.getUserByIdService" } });

    return user;
  };

  static searchUsersService = async (query: string) => {
    const users = await authRepo.searchUsers(query);
    return users;
  };
}

export default UserService;
