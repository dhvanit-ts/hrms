import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    role: {
      type: String,
      enum: ["Admin", "User"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      refPath: "role",
    },
    logVersion: {
      type: Number,
      default: 1,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "user_upvoted_post",
        "user_upvoted_comment",
        "user_downvoted_post",
        "user_downvoted_comment",
        "user_deleted_vote_on_comment",
        "user_deleted_vote_on_post",
        "user_switched_vote_on_comment",
        "user_switched_vote_on_post",
        "user_created_post",
        "user_updated_post",
        "user_created_comment",
        "user_updated_comment",
        "user_deleted_post",
        "user_deleted_comment",
        "user_reported_content",
        "user_accepted_terms",
        "user_initialized_account",
        "user_created_account",
        "user_verified_otp",
        "user_failed_to_verify_otp",
        "user_reset_email_otp",
        "user_logged_in_self",
        "user_logged_out_self",
        "user_created_feedback",
        "user_updated_feedback",
        "user_deleted_feedback",
        "user_forgot_password",
        "user_initialized_forgot_password",

        "admin_banned_user",
        "admin_unbanned_user",
        "admin_suspended_user",
        "admin_created_college",
        "admin_deleted_college",
        "admin_updated_college",
        "admin_blocked_content",
        "admin_unblocked_content",
        "admin_shadow_banned_content",
        "admin_shadow_unbanned_content",
        "admin_updated_content",
        "admin_deleted_report",
        "admin_bulk_deleted_reports",
        "admin_updated_report_status",
        "admin_updated_feedback_status",
        "admin_deleted_feedback",

        "system_created_admin_account",
        "admin_logged_out_self",
        "admin_initialized_account",
        "admin_verified_otp",
        "admin_removed_authorized_device",
        "admin_reset_email_otp",
        "admin_deleted_admin_account",
        "admin_updated_admin_account",
        "admin_fetched_all_admin_accounts",

        "system_logged_error",
        "system_logged_in",
        "system_logged_out",

        "other_action",
      ],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Flexible payload: device info, IP, videoId, errorCode, whatever.
    },
    sessionId: {
      type: String,
      // Link multiple logs together
    },
    platform: {
      type: String,
      required: true,
      enum: ["web", "mobile", "tv", "server", "other"],
    },
    status: {
      type: String,
      enum: ["success", "fail"],
      default: "success",
    },
  },
  { timestamps: true, expires: "30d" }
);

export const LogModel = mongoose.model("Log", logSchema);
