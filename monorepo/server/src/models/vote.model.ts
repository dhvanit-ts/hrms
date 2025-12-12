import mongoose, { Schema } from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
    type: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment" }
  },
  { timestamps: true }
);

const VoteModel = mongoose.model("Vote", voteSchema);

export default VoteModel;
