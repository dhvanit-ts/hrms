import mongoose, { Schema } from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      enum: [
        "Ask Flick", // AMA-style Q&A
        "Serious Discussion", // Longform thought, critical debate
        "Career Advice", // Jobs, interviews, tech growth
        "Showcase", // Demos, projects, portfolios
        "Off-topic", // Memes, casual chatter
        "Community Event", // Fests, announcements, contests
        "Rant / Vent", // Emotional unloads, safe zone
        "Help / Support", // “Stuck on X”, troubleshooting
        "Feedback / Suggestion", // Feature requests, bug reports
        "News / Update", // Industry news, changelogs, announcements
        "Guide / Resource", // Tutorials, resources, link dumps
      ],
      required: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isShadowBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const PostModel = mongoose.model("Post", postSchema);
