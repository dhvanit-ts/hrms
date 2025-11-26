import ApiResponse from "@/core/http/ApiResponse";
import { AsyncHandler } from "@/core/http/asyncHandler";
import userService from "@/modules/user/user.service";
import authService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import ApiError from "@/core/http/ApiError";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.middleware";

class AdminController {
  @AsyncHandler()
  async getAdmin(req: Request) {
    const admin = await adminService.getAdmin(req.params.adminId);
    return ApiResponse.ok(admin);
  }

  @AsyncHandler()
  async listAdmins() {
    const admins = await adminService.listAdmins();
    return ApiResponse.ok(admins);
  }

  @AsyncHandler()
  async createAdmin(req: AuthenticatedRequest, res: Response) {
    // Only super-admin can create admins
    // permissionService.assert(req.user, "ADMIN_CREATE");

    const { email, username } = req.body;

    const admin = await adminService.createAdmin({ email, username });

    return ApiResponse.created(admin, "Admin created");
  }

  @AsyncHandler()
  async promoteUser(req: AuthenticatedRequest) {
    permissionService.assert(req.user, "ADMIN_MANAGE_ROLES");

    const updated = await adminService.promoteToAdmin(req.body.userId);

    return ApiResponse.ok(updated, "User promoted to admin");
  }

  @AsyncHandler()
  async revokeAdmin(req: AuthenticatedRequest) {
    permissionService.assert(req.user, "ADMIN_MANAGE_ROLES");

    const updated = await adminService.demoteFromAdmin(req.body.adminId);

    return ApiResponse.ok(updated, "Admin role revoked");
  }
}

export default new AdminController();
