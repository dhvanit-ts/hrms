import mongoose from "mongoose";
import type { DB } from "./types";

export async function runTransaction<T>(
  callback: (tx: DB) => Promise<T>,
  session?: DB
): Promise<T> {
  const hasParent = !!session;

  if (hasParent) {
    // Reuse existing mongoose session
    return callback(session);
  }

  // Create and manage our own session
  const newSession = await mongoose.startSession();
  newSession.startTransaction();

  try {
    const result = await callback(newSession);
    await newSession.commitTransaction();
    return result;
  } catch (err) {
    await newSession.abortTransaction();
    throw err;
  } finally {
    newSession.endSession();
  }
}
