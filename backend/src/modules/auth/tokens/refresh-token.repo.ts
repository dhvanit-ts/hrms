import logger from "@/core/logger/logger";
import { DB } from "@/infra/db/types";
import * as refreshTokenAdapter from "@/infra/db/adapters/refresh-token.adapter";

export const revokeAllRefreshTokens = async (userId: string, dbTx?: DB) => {
  logger.info(`Revoking all refresh tokens for user ${userId}`);
  return refreshTokenAdapter.revokeAllRefreshTokens(userId, dbTx);
};

export const revokeRefreshToken = async (
  jti: string,
  newJti: string,
  dbTx?: DB
) => {
  logger.info(`Revoking refresh token ${jti}`);
  return refreshTokenAdapter.revokeRefreshToken(jti, newJti, dbTx);
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
  dbTx?: DB
) => {
  logger.info(`Saving refresh token for user ${userId}`);
  return refreshTokenAdapter.saveRefreshToken(userId, refreshToken, dbTx);
};

export const findRefreshToken = async (id: string, jti: string, dbTx?: DB) => {
  logger.info(`Finding refresh token ${jti} for user ${id}`);
  return refreshTokenAdapter.findRefreshToken(id, jti, dbTx);
};
