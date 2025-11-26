import * as adminRepo from "@/infra/db/adapters/admin.adapter";

class AdminService {
  async createAdmin({
    email,
    username,
    password,
  }: {
    email: string;
    username: string;
    password: string;
  }) {
    const admin = await adminRepo.createAdmin({ email, username, password });
    return admin;
  }

  async getAdmin(adminId: string) {
    return adminRepo.getAdmin(adminId);
  }

  async listAdmins() {
    return adminRepo.listAdmins();
  }

  async promoteToAdmin(adminId: string) {
    return adminRepo.promoteToAdmin(adminId);
  }

  async demoteFromAdmin(adminId: string) {
    return adminRepo.demoteFromAdmin(adminId);
  }
}

export default new AdminService();
