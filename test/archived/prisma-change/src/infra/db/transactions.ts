import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from ".";
import type { Prisma, PrismaClient } from "@prisma/client";

type OmitMissingProperties = PrismaClient<
  Prisma.PrismaClientOptions,
  Prisma.LogLevel,
  DefaultArgs
>;

export async function runTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  tx?: PrismaClient
): Promise<T> {
  const hasParent = !!tx;

  if (hasParent) {
    return callback(tx);
  }

  return prisma.$transaction(async (innerTx: OmitMissingProperties) => {
    return callback(innerTx);
  });
}
