import compose from "@/lib/compose";
import { verifyUserJWT } from "./auth.middleware";
import { requireRole } from "./requireRoles.middleware";

export const authenticate = compose(verifyUserJWT)
export const adminOnly = compose(verifyUserJWT, requireRole("admin"))
export const adminsOnly = compose(verifyUserJWT, requireRole("superadmin", "admin"))