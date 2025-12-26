import { HttpError } from "@/core/http";
import AuthRepo from "@/modules/auth/auth.repo";

class UserService {
  static getUserByIdService = async (userId: string) => {
    const user = await AuthRepo.CachedRead.findById(userId);

    if (!user)
      throw HttpError.notFound("User doesn't exists", { code: "USER_NOT_FOUND", meta: { service: "authService.getUserByIdService" } });

    return user;
  };

  static searchUsersService = async (query: string) => {
    const users = await AuthRepo.CachedRead.searchUsers(query);
    return users;
  };
}

export default UserService;
