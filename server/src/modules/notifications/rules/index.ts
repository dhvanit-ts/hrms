import { PostUpvotedRule, LeaveRequestedRule, LeaveApprovedRule, LeaveRejectedRule } from "./notification.rules";
import { NotificationRule } from "./notification.rules-interface";

const RULES = {
  POST_UPVOTED: PostUpvotedRule,
  LEAVE_REQUESTED: LeaveRequestedRule,
  LEAVE_APPROVED: LeaveApprovedRule,
  LEAVE_REJECTED: LeaveRejectedRule,
  // COMMENT_REPLIED: CommentRepliedRule
}

export type RuleKeys = keyof typeof RULES

export default RULES