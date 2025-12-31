import compose from "@/lib/compose";
import { requireRole } from "./auth/requireRoles.middleware";
import { authenticate } from "./auth/authenticate.middleware";
import { requireAuth } from "./auth/requireAuth.middleware";

export const requireAuthenticatedUser = compose(authenticate, requireAuth)
export const adminOnly = compose(requireAuthenticatedUser, requireRole("admin"))
export const adminsOnly = compose(requireAuthenticatedUser, requireRole("superadmin", "admin"))
