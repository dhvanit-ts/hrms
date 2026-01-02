import { PostUpvotedRule } from "./notification.rules";
import { NotificationRule } from "./notification.rules-interface";

const RULES = {
  POST_UPVOTED: PostUpvotedRule,
  // COMMENT_REPLIED: CommentRepliedRule
}

export type RuleKeys = keyof typeof RULES

export default RULES