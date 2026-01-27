import { ICollege } from "@/types/College";
import { IPost } from "@/types/Post";
import { IUser } from "@/types/User";

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function isUser(obj: unknown): obj is IUser {
  return typeof obj === "object" && obj !== null && "college" in obj && "branch" in obj;
}

export function isCollege(obj: unknown): obj is ICollege {
  return typeof obj === "object" && obj !== null && "profile" in obj && "name" in obj;
}

export function isPost(obj: unknown): obj is IPost {
  return typeof obj === "object" && obj !== null && "title" in obj && "content" in obj;
}

export const getAvatarUrl = (user: IUser | string) => isUser(user) && isCollege(user.college) ? user.college.profile : "";
export const getCollegeName = (user: IUser | string) => isUser(user) && isCollege(user.college) ? user.college.name : "Unknown College";