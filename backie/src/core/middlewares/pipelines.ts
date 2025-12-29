import compose from "@/lib/compose";
import { requireRole } from "./requireRoles.middleware";
import { authenticate } from "./auth.middleware";

export const adminOnly = compose(authenticate, requireRole("admin"))
export const adminsOnly = compose(authenticate, requireRole("superadmin", "admin"))