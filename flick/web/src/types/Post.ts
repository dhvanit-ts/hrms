import { IUser } from "./User";
import { TPostTopic } from "@/types/postTopics";

export interface IPost extends Document {
  _id: string;
  title: string;
  content: string;
  postedBy: string | IUser;
  isBanned: boolean;
  isShadowBanned: boolean;
  karma: number;
  userVote?: "upvote" | "downvote";
  bookmarked?: boolean;
  upvoteCount: number;
  downvoteCount: number;
  views: number;
  commentsCount?: number;
  topic: TPostTopic;
  createdAt: string;
  updatedAt: string;
}
