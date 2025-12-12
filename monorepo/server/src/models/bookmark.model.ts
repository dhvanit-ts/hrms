import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const BookmarkModel = mongoose.model("Bookmark", bookmarkSchema);

export default BookmarkModel;
