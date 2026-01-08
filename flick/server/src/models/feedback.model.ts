import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["feedback", "bug"],
      default: "feedback",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "dismissed"],
      default: "new",
    },
  },
  { timestamps: true }
);

const FeedbackModel = mongoose.model("Feedback", feedbackSchema);

export default FeedbackModel;