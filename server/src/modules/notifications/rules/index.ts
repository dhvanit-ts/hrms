import {
  PostUpvotedRule,
  LeaveRequestedRule,
  LeaveApprovedRule,
  LeaveRejectedRule,
  AttendanceCorrectionRequestedRule,
  AttendanceCorrectionApprovedRule,
  AttendanceCorrectionRejectedRule
} from "./notification.rules";
import { NotificationRule } from "./notification.rules-interface";

const RULES = {
  POST_UPVOTED: PostUpvotedRule,
  LEAVE_REQUESTED: LeaveRequestedRule,
  LEAVE_APPROVED: LeaveApprovedRule,
  LEAVE_REJECTED: LeaveRejectedRule,
  ATTENDANCE_CORRECTION_REQUESTED: AttendanceCorrectionRequestedRule,
  ATTENDANCE_CORRECTION_APPROVED: AttendanceCorrectionApprovedRule,
  ATTENDANCE_CORRECTION_REJECTED: AttendanceCorrectionRejectedRule,
  // COMMENT_REPLIED: CommentRepliedRule
}

export type RuleKeys = keyof typeof RULES

export default RULES