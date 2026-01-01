import compose from "@/lib/compose";
import { requireRole } from "./auth/require-roles.middleware";
import { authenticate } from "./auth/authenticate.middleware";
import { requireAuth } from "./auth/require-auth.middleware";

export const requireAuthenticatedUser = compose(authenticate, requireAuth)
export const adminOnly = compose(requireAuthenticatedUser, requireRole("admin"))
export const adminsOnly = compose(requireAuthenticatedUser, requireRole("superadmin", "admin"))
