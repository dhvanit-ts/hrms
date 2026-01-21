import { useState } from "react"
import { FaCheck } from "react-icons/fa6"
import { toast } from "sonner"
import { env } from "@/conf/env"
import { PiShareFatFill } from "react-icons/pi"

function ShareButton({ id }: { id: string }) {
  const [shared, setShared] = useState(false)

  const handleShare = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation()
    setShared(true)
    navigator.clipboard.writeText(`${env.baseUrl}/p/${id}`)
    toast.success("Link copied to clipboard")
    setTimeout(() => {
      setShared(false)
    }, 5000);
  }

  return (
    <button className="group bg-zinc-200 dark:bg-zinc-800 py-1 px-2 rounded-full" disabled={shared} onClick={handleShare}>
      {shared ? <FaCheck className="text-green-500 text-xl m-0.5" /> : <PiShareFatFill className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 hover:scale-105 transition-all duration-300 text-xl m-0.5" />}
    </button>
  )
}

export default ShareButton