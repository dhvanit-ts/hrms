import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BsDot } from "react-icons/bs";
import EngagementComponent from "./EngagementComponent";
import PostDropdown from "../actions/PostDropdown";
import { isCollege, isUser } from "@/utils/helpers";
import { IComment } from "@/types/Comment";
import { useState } from "react";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";

function Comment({ comment, className, depth = 0 }: { comment: IComment, className?: string, depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      <Card className={`dark:bg-transparent bg-transparent border-x-0 shadow-none rounded-none ${className}`}>
        <CardHeader className="flex-row justify-between space-x-2 p-4">
          <div className="flex space-x-4">
            <VisuallyHidden>
              <CardTitle>{(isUser(comment.commentedBy) && isCollege(comment.commentedBy.college)) ? comment.commentedBy.college.name : "Unknown College"}</CardTitle>
              <CardDescription>{comment.content}</CardDescription>
            </VisuallyHidden>
            <Avatar>
              <AvatarImage src={isUser(comment.commentedBy) && isCollege(comment.commentedBy.college) ? comment.commentedBy.college.profile : "Unknown"} />
              <AvatarFallback>{""}</AvatarFallback>
            </Avatar>
            <div>
              <h2>{(isUser(comment.commentedBy) && isCollege(comment.commentedBy.college)) ? comment.commentedBy.college.name : "Unknown College"}</h2>
              <p className="flex space-x-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span>{isUser(comment.commentedBy) ? comment.commentedBy.username : comment.commentedBy}</span>
                <BsDot size={16} />
                <span>{isUser(comment.commentedBy) ? comment.commentedBy.branch : "Unknown"}</span>
                <BsDot size={16} />
                <span>{comment.createdAt}</span>
              </p>
            </div>
          </div>
          <PostDropdown showBookmark={false} id={comment._id} type="comment" key={comment._id} editableData={{ title: "", content: comment.content }} />
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 dark:text-zinc-400 pt-1">{comment.content}</p>
        </CardContent>
        <CardFooter>
          <EngagementComponent userVote={comment.userVote ?? null} _id={comment._id} targetType="comment" initialCounts={{ upvotes: comment.upvoteCount, downvotes: comment.downvoteCount, comments: comment.children?.length ?? 0 }} key={comment._id} show={['upvotes', "downvotes", "comments"]} />
        </CardFooter>
        {comment.children && comment.children.length > 0 && (
          isExpanded ?
            <div
              className={`ml-6 pl-4 border-l-2 pt-2 ${depth > 3 ? "ml-2" : ""
                } border-zinc-300 dark:border-zinc-700`}
            >
              {comment.children.map((child) => (
                <Comment key={child._id} comment={child} depth={depth + 1} />
              ))}
              <button className="px-3 p-2 ml-4 my-2 transition-colors flex space-x-2 justify-center items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md" onClick={() => setIsExpanded(false)}>
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Hide replies</span>
                <IoMdArrowDropup className="text-xl" />
              </button>
            </div>
            : <button className="px-3 p-2 ml-4 mb-2 transition-colors flex space-x-2 justify-center items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md" onClick={() => setIsExpanded(true)}>
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">View replies ({comment.children.length})</span>
              <IoMdArrowDropdown className="text-xl" />
            </button>
        )}
      </Card>
    </>
  )
}

export default Comment