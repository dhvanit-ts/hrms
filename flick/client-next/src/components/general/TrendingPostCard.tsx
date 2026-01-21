import { BsEye } from "react-icons/bs"
import { Card } from "../ui/card"
import { ITrendingPost } from "@/types/TrendingPost"
function TrendingPostCard({ title, category, time, views }: ITrendingPost) {
  return (
    <Card className="p-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer border-none space-y-1">
      <div className="flex justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{category} <span className="text-zinc-500 dark:text-zinc-500 text-xs ml-1">{time}</span></p>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded-full px-2 py-0.5 flex justify-center items-center space-x-1">
          <BsEye />
          <span>{views}</span>
        </div>
      </div>
      <h5 className="text-zinc-900 dark:text-zinc-100">{title}</h5>
    </Card>
  )
}

export default TrendingPostCard