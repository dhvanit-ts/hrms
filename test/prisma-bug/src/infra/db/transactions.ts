import prisma from ".";
import { DBTx } from "./types";

export async function runTransaction<T>(
  callback: (tx: DBTx) => Promise<T>,
  tx?: DBTx
): Promise<T> {
  if (tx) {
    return callback(tx);
  }

  return prisma.$transaction(async (innerTx) => {
    return callback(innerTx);
  });
}
