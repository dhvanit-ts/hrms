import db from "@/infra/db";
import type { DB } from "./types";

export async function runTransaction<T>(
  callback: (tx: DB) => Promise<T>,
  tx?: DB
): Promise<T> {
  const hasParent = !!tx;

  if (hasParent) {
    // Reuse existing transaction
    return callback(tx);
  }

  // Create and manage our own
  return db.transaction(async (innerTx) => {
    return callback(innerTx);
  });
}
