import TrendingPostCard from "./TrendingPostCard"
import { useCallback, useEffect, useState } from "react"
import axios, { AxiosError } from "axios"
import { env } from "@/conf/env"
import { ITrendingPost } from "@/types/TrendingPost"
import { toast } from "sonner"
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorHandler } from "@/hooks/useErrorHandler"

function TrendingPostSection() {

  const [posts, setPosts] = useState<ITrendingPost[]>([])
  const [loading, setLoading] = useState(false)

  const { handleError } = useErrorHandler()

  const fetchPosts = useCallback(async () => {
    try {

      setLoading(true)

      // TODO: make an API for this
      const res = await axios.get(`${env.serverApiEndpoint}/`)

      if (res.status !== 200) {
        toast.error("Error fetching trending posts")
      }

      setPosts(res.data.posts)

    } catch (error) {
      handleError(error as AxiosError, "Error fetching trending posts", undefined, fetchPosts, "Failed to fetch trending posts")
    } finally {
      setLoading(false)
    }

  }, [handleError])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return (
    <div className="py-6 w-full max-w-80">
      <section>
        <h2>Most read</h2>
        <div className="mt-2 rounded-md min-h-64 border-[1px] border-zinc-300 dark:border-zinc-800 divide-y divide-zinc-300 dark:divide-zinc-800">
          {loading
            ? [...Array(4)].map((_, index) => (
              <CardSkeleton key={index} />
            ))
            : (posts.length > 0
              ? posts.map(({ time, views, category, title }) => (
                <TrendingPostCard
                  key={title}
                  time={time}
                  views={views}
                  category={category}
                  title={title}
                />
              ))
              : <div className="flex items-center justify-center h-96">
                <p>Posts not found</p>
              </div>
            )
          }
        </div>
      </section>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <Card className="p-4 bg-zinc-100 dark:bg-zinc-900 border-none space-y-1">
      <div className="flex justify-between">
        {/* category + time */}
        <Skeleton className="h-4 w-28 bg-zinc-300 dark:bg-zinc-700 rounded" />

        {/* views */}
        <div className="flex items-center space-x-1 bg-zinc-200 dark:bg-zinc-800 rounded-full px-2 py-0.5">
          <Skeleton className="h-3 w-3 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <Skeleton className="h-3 w-6 bg-zinc-300 dark:bg-zinc-700 rounded" />
        </div>
      </div>

      {/* title */}
      <Skeleton className="h-5 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded" />
    </Card>
  );
}

export default TrendingPostSection