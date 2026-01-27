import { INotification } from "@/types/Notification"
import { useNavigate } from "react-router-dom"
import { PiArrowFatUpFill } from "react-icons/pi";
import { FaComment } from "react-icons/fa";

function NotificationCard({ _redisId, actorUsernames, post, _id, seen, type, content }: Partial<INotification>) {
  const navigate = useNavigate()
  return (
    <div
      className={`flex items-center space-x-6 py-4 px-6 border-[1px] border-zinc-200 dark:border-zinc-800 ${seen ? "hover:bg-zinc-100 dark:hover:bg-zinc-800" : "bg-blue-600/5"} cursor-pointer`}
      onClick={() => navigate(`/p/${post?._id}`)}
      key={_id || _redisId}
    >
      <div className="flex justify-center items-center">
        {(type === "upvoted_post" || type === "upvoted_comment") && <PiArrowFatUpFill className="text-blue-500 text-3xl" />}
        {(type === "replied" || type === "posted") && <FaComment className="text-red-500 text-2xl" />}
      </div>
      <div className="flex flex-col">
        {(type === "upvoted_post" || type === "upvoted_comment") && <p>{actorUsernames && actorUsernames[0]} {actorUsernames && actorUsernames.length > 1 ? "and" : ""} {actorUsernames && actorUsernames.length > 2 ? `${actorUsernames.length - 1} others` : actorUsernames && actorUsernames[1]} liked your {type === "upvoted_post" ? "post" : "comment"}</p>}
        {type === "upvoted_comment" || type === "upvoted_post" && <p className="text-zinc-600 dark:text-zinc-400">{post?.content}</p>}
        {type === "replied" && <p>{actorUsernames && actorUsernames[0]} replied to your post</p>}
        {content && <p>{content}</p>}
      </div>
    </div>
  )
}

export default NotificationCard