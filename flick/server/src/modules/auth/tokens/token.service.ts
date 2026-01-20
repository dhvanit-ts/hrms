import jwt from "jsonwebtoken";
import { Request } from "express";
import { env } from "@/config/env";
import { randomUUID } from "node:crypto";
import AuthRepo from "@/modules/auth/auth.repo";
import { runTransaction } from "@/infra/db/transactions";
import { DB } from "@/infra/db/types";
import logger from "@/core/logger";

class TokenService {
  accessTokenExpiryMs = 1000 * 60 * parseInt(env.ACCESS_TOKEN_TTL || "0", 10);
  refreshTokenExpiryMs =
    1000 * 60 * 60 * 24 * parseInt(env.REFRESH_TOKEN_TTL || "0", 10);

  generateAccessToken(id: string, username: string) {
    logger.debug("Generating access token", { userId: id, username });
    return jwt.sign({ id, username }, env.ACCESS_TOKEN_SECRET, {
      expiresIn: `${env.ACCESS_TOKEN_TTL}m` as jwt.SignOptions["expiresIn"],
    });
  }

  generateRefreshToken(id: string, username: string) {
    return jwt.sign({ id, username }, env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${env.REFRESH_TOKEN_TTL}d` as jwt.SignOptions["expiresIn"],
    });
  }

  async generateAndPersistTokens(
    id: string,
    username: string,
    _req: Request,
    dbTx?: DB
  ) {
    logger.info("Generating and persisting tokens", { userId: id, username });
    
    return await runTransaction(async (tx) => {
      const accessToken = this.generateAccessToken(id, username);
      const refreshToken = this.generateRefreshToken(id, username);

      await AuthRepo.Write.updateRefreshToken(id, refreshToken, tx);

      logger.info("Tokens generated and persisted successfully", { userId: id });
      return { accessToken, refreshToken };
    }, dbTx);
  }

  createTempTokenPair(accessToken: string, refreshToken: string) {
    const tempToken = randomUUID();
    return {
      tempToken,
      payload: { accessToken, refreshToken, createdAt: Date.now() },
    };
  }
}

export default new TokenService();
