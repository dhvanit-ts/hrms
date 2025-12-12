import mongoose, { Types } from "mongoose";

export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }

  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }

  throw new Error(`Invalid ObjectId provided for conversion: ${id}`);
}