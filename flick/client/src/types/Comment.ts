import { IPost } from "./Post";
import { IUser } from "./User";

export interface IComment {
  _id: string;
  content: string;
  postId: string | IPost;
  commentedBy: string | IUser;
  isBanned: boolean;
  userVote?: "upvote" | "downvote";
  upvoteCount: number;
  downvoteCount: number;
  parentCommentId?: string;
  children?: IComment[];
  createdAt: string;
  updatedAt: string;
}