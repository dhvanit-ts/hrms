import { Request } from "express";
import AuthRepo from "@/modules/auth/auth.repo";
import recordAudit from "@/lib/record-audit";
import logger from "@/core/logger";
import { auth } from "@/infra/auth/auth";
import parseHeaders from "@/lib/better-auth/parse-headers";

class OAuthService {
  handleGoogleOAuth = async (code: string, req: Request) => {
    logger.info("Handling Google OAuth", { code: code.substring(0, 10) + "..." });

    // Exchange code for access token
    // Get user info
    // Check existing user

    const headers = parseHeaders(req.headers)

    const session = await auth.api.getSession({ headers });

    const existingUser = await AuthRepo.CachedRead.findByEmail(session.user.email)

    if (!existingUser) {
      await AuthRepo.Write.create({
        email: session.user.email,
        username: session.user.name.trim().toLowerCase().replace(" ", ""),
        authType: "oauth",
        password: null,
        roles: ["user"],
        isBlocked: false,
        suspension: null
      });

      if (session) {
        await recordAudit({
          action: "user:created:account",
          entityType: "user",
          entityId: session.user.id,
        });
      }
    }
  };
}

export default new OAuthService();
