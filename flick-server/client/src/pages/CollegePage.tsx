import Post from "@/components/general/Post"
import SkeletonCard from "@/components/skeletons/PostSkeleton"
import { env } from "@/conf/env"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import usePostStore from "@/store/postStore"
import useProfileStore from "@/store/profileStore"
import { IPost } from "@/types/Post"
import { formatDate, getAvatarUrl, getCollegeName, isUser } from "@/utils/helpers"
import axios, { AxiosError } from "axios"
import { useCallback, useEffect, useState } from "react"

function CollegePage() {

  const [loading, setLoading] = useState(false)
  const { handleError } = useErrorHandler()
  const profile = useProfileStore(state => state.profile)
  const posts = usePostStore(state => state.posts)
  const setPosts = usePostStore(state => state.setPosts)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      if (!profile.college) return

      const res = await axios.get(`${env.serverApiEndpoint}/posts/college/${profile.college}`, { withCredentials: true })

      if (res.status !== 200) {
        throw new Error("Failed to fetch posts")
      }
      setPosts(res.data.posts)
    } catch (error) {
      await handleError(error as AxiosError | Error, "Error fetching posts", undefined, () => fetchPosts(), "Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }, [handleError, profile.college, setPosts])

  useEffect(() => {
    document.title = "Feed | Flick"
    fetchPosts()
  }, [fetchPosts])

  const removedPostOnAction = (id: string) => {
    const updatedPost = posts?.filter(post => post._id !== id) as IPost[]
    setPosts(updatedPost)
  }

  if (loading) {
    return (
      <section className="w-full max-h-screen overflow-y-auto no-scrollbar py-6 divide-y divide-zinc-300/60 dark:divide-zinc-700/50">
        {[...Array(10)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </section>
    )
  }

  return (
    <section className="w-full max-h-screen overflow-y-auto no-scrollbar py-6 divide-y divide-zinc-300/60 dark:divide-zinc-700/50">
      {posts && posts.length > 0 ? (
        posts.map((post) => {
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
              removedPostOnAction={removedPostOnAction}
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
    </section>
  )
}

export default CollegePage