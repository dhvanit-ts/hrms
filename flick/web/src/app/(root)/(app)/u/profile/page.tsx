import useProfileStore from "@/store/profileStore"
import { formatDate, getAvatarUrl, getCollegeName, isCollege, isUser } from "@/utils/helpers"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BsDot } from "react-icons/bs"
import { useEffect, useState } from "react"
import axios from "axios"
import { env } from "@/conf/env"
import { IUser } from "@/types/User"
import { ICollege } from "@/types/College"
import { IPost } from "@/types/Post"
import Post from "@/components/general/Post"
import { Skeleton } from "@/components/ui/skeleton"
import SkeletonCard from "@/components/skeletons/PostSkeleton"

interface IProfile extends IUser {
  college: ICollege,
  posts: IPost[],
  karma: number
}

function ProfilePage() {

  const [profile, setProfile] = useState<null | IProfile>(null)

  const user = useProfileStore(state => state.profile)

  useEffect(() => {
    if (!user._id) {
      (async () => {
        const response = await axios.get(`${env.serverApiEndpoint}/users/profile`, {
          withCredentials: true,
        })

        if (response.status === 200) {
          setProfile(response.data.data)
        } else {
          console.error("Failed to fetch profile data")
        }
      })()
    }
  }, [user._id])

  return (
    <div className="py-12">
      {profile
        ? <>
          <div className="flex items-center space-x-4 h-40">
            <Avatar className='cursor-pointer w-28 h-28 transition-colors duration-300 border-2 border-transparent hover:border-zinc-400'>
              <AvatarImage src={isCollege(profile.college) ? profile.college.profile : "Unknown College"} alt={profile.username} />
              <AvatarFallback className='bg-zinc-200 cursor-pointer select-none'>{user.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="">
              <h4 className="text-xl font-semibold">{profile.username}</h4>
              <p className="text-zinc-600 dark:text-zinc-500 flex items-center space-x-0.5">
                <span>{isCollege(profile.college) ? profile.college.name : "Unknown College"}</span>
                <BsDot size={24} />
                <span>{profile.branch}</span>
                <BsDot size={24} />
                <span>{profile.karma} Karma</span>
              </p>
            </div>
          </div>
          <div className="mt-6">
            {profile.posts && profile.posts.length > 0 ? (
              profile.posts.map((post) => {
                const postedBy = post.postedBy;

                if (!isUser(postedBy)) {
                  // postedBy is just a string, fallback
                  return (
                    <Post
                      key={post._id}
                      _id={post._id}
                      avatar=""
                      userVote={post.userVote ?? null}
                      username="Unknown"
                      title={post.title}
                      topic={post.topic}
                      bookmarked={post.bookmarked ?? false}
                      branch="Unknown"
                      viewsCount={post.views}
                      content={post.content}
                      avatarFallback=""
                      college="Unknown"
                      createdAt={formatDate(post.createdAt)}
                      upvoteCount={post.upvoteCount}
                      downvoteCount={post.downvoteCount}
                      commentsCount={post.commentsCount ?? 0}
                    />
                  )
                }

                // postedBy is a full IUser object here
                return (
                  <Post
                    key={post._id}
                    _id={post._id}
                    avatar={getAvatarUrl(postedBy)}
                    college={getCollegeName(postedBy)}
                    topic={post.topic}
                    username={postedBy.username}
                    userVote={post.userVote ?? null}
                    title={post.title}
                    bookmarked={post.bookmarked ?? false}
                    branch={postedBy.branch}
                    viewsCount={post.views}
                    content={post.content}
                    avatarFallback=""
                    createdAt={formatDate(post.createdAt)}
                    upvoteCount={post.upvoteCount}
                    downvoteCount={post.downvoteCount}
                    commentsCount={post.commentsCount ?? 0}
                  />
                )
              })
            ) : (
              <div className="flex justify-center items-center h-full">
                <p>No posts found</p>
              </div>
            )}
          </div>
        </>
        : <>
          <ProfileSkeleton />
          <div className="mt-6 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      }
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4 h-40">
      <Skeleton className="w-28 h-28 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage