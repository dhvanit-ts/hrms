import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    seen: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    receiverId: {
      type: String,
      required: true,
    },
    actorUsernames: [
      {
        type: String,
        required: true,
      },
    ],
    content: {
      type: String,
    },
    type: {
      type: String,
      enum: ["general", "upvoted_post", "upvoted_comment", "replied", "posted"],
      default: "general",
    },
  },
  { timestamps: true, expires: '84d' }
);

notificationSchema.index({ createdAt: -1, receiverId: 1 });

export const NotificationModel = mongoose.model(
  "Notification",
  notificationSchema
);
