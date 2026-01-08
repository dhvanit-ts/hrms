import { INotification } from "@/types/Notification";

const getNotificationAction = (type: INotification["type"]) => {
  switch (type) {
    case "upvoted_post":
      return "upvoted your post";
    case "upvoted_comment":
      return "upvoted your comment";
    case "replied":
      return "replied to your post";
    case "general":
      return "notified you";
    default:
      return "notified you";
  }
};

export default getNotificationAction;
