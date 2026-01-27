import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BsDot } from "react-icons/bs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useNavigate } from "react-router-dom";
import EngagementComponent from "./EngagementComponent";
import PostDropdown from "../actions/PostDropdown";
import { TPostTopic } from "@/types/postTopics";
import useProfileStore from "@/store/profileStore";

interface PostProps {
  avatar: string,
  avatarFallback: string
  createdAt: string
  college: string
  _id: string
  title: string
  content: string
  upvoteCount: number
  downvoteCount: number
  commentsCount: number
  userVote: "upvote" | "downvote" | null
  viewsCount: number
  username: string
  branch: string
  bookmarked: boolean
  removedPostOnAction?: (id: string) => void
  topic: TPostTopic
}

function Post({ avatar, userVote, avatarFallback, _id, createdAt, college, title, content, upvoteCount, downvoteCount, commentsCount, viewsCount, username, branch, topic, bookmarked, removedPostOnAction }: PostProps) {
  const profile = useProfileStore(state => state.profile)
  const navigate = useNavigate()
  return (
    <Card onClick={() => navigate(`/p/${_id}`)} className="dark:bg-transparent bg-transparent border-none shadow-none rounded-none">
      <CardHeader className="flex-row justify-between space-x-2 p-4">
        <div className="flex space-x-4">
          <VisuallyHidden>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{content}</CardDescription>
          </VisuallyHidden>
          <Avatar>
            <AvatarImage src={avatar} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="flex items-center space-x-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
              <span>{branch}</span>
              <BsDot size={14} />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">{createdAt}</span>
            </h2>
            <p className="flex space-x-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span>{college}</span>
              <BsDot size={16} />
              <span>{username}</span>
              <BsDot size={16} />
              <span>{topic}</span>
            </p>
          </div>
        </div>
        <PostDropdown removePostOnAction={removedPostOnAction} bookmarked={bookmarked} id={_id} type="post" key={_id} editableData={profile.username === username ? { title, content } : null} />
      </CardHeader>
      <CardContent>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-zinc-600 dark:text-zinc-400 pt-1">{content}</p>
      </CardContent>
      <CardFooter>
        <EngagementComponent userVote={userVote} _id={_id} targetType="post" initialCounts={{ upvotes: upvoteCount, downvotes: downvoteCount, comments: commentsCount, views: viewsCount }} key={title} show={['upvotes', "downvotes", 'comments', 'views', "share"]} />
      </CardFooter>
    </Card>
  )
}

export default Post