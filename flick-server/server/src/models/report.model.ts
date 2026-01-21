import mongoose, { Schema } from "mongoose";

const reportModel = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Post", "Comment"],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    refPath: "type",
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "ignored"],
    default: "pending",
  },  
  message: {
    type: String,
    required: true,
  },
}, {timestamps: true});

export const ReportModel = mongoose.model("Report", reportModel);
