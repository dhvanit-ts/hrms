import jwt from "jsonwebtoken";
import { Request } from "express";
import { env } from "@/config/env";
import { randomUUID } from "node:crypto";
import * as authRepo from "@/modules/auth/auth.repo";
import { runTransaction } from "@/infra/db/transactions";
import { DB } from "@/infra/db/types";

class TokenService {
  static accessTokenExpiryMs = 1000 * 60 * parseInt(env.ACCESS_TOKEN_TTL || "0", 10);
  static refreshTokenExpiryMs =
    1000 * 60 * 60 * 24 * parseInt(env.REFRESH_TOKEN_TTL || "0", 10);

  static generateAccessToken(id: string, username: string) {
    return jwt.sign({ id, username }, env.ACCESS_TOKEN_SECRET, {
      expiresIn: `${env.ACCESS_TOKEN_TTL}m` as jwt.SignOptions["expiresIn"],
    });
  }

  static generateRefreshToken(id: string, username: string) {
    return jwt.sign({ id, username }, env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${env.REFRESH_TOKEN_TTL}d` as jwt.SignOptions["expiresIn"],
    });
  }

  static async generateAndPersistTokens(
    id: string,
    username: string,
    _req: Request,
    dbTx?: DB
  ) {
    return await runTransaction(async (tx) => {
      const accessToken = this.generateAccessToken(id, username);
      const refreshToken = this.generateRefreshToken(id, username);

      await authRepo.updateRefreshToken(id, refreshToken, tx);

      return { accessToken, refreshToken };
    }, dbTx);
  }

  static createTempTokenPair(accessToken: string, refreshToken: string) {
    const tempToken = randomUUID();
    return {
      tempToken,
      payload: { accessToken, refreshToken, createdAt: Date.now() },
    };
  }
}

export default TokenService;
