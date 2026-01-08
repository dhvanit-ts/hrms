import { HttpError } from "@/core/http";
import AuthRepo from "@/modules/auth/auth.repo";

class UserService {
  getUserByIdService = async (userId: string) => {
    const user = await AuthRepo.CachedRead.findById(userId);

    if (!user)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.getUserByIdService" },
      });

    return user;
  };

  searchUsersService = async (query: string) => {
    const users = await AuthRepo.CachedRead.searchUsers(query);

    return users;
  };
}

export default new UserService();
