import { IPost } from "./Post";
import { IUser } from "./User";

interface IBookmark {
  _id: string;
  userId: string | IUser;
  postId: string | IPost
}

export default IBookmark