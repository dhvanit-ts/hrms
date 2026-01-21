/* eslint-disable react-hooks/exhaustive-deps */
import NotificationCard from "@/components/general/NotificationCard"
import { env } from "@/conf/env"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { INotification } from "@/types/Notification"
import axios, { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { toast } from "sonner"

function NotificationsPage() {

  const [notifications, setNotifications] = useState<INotification[]>([])
  const [loading, setLoading] = useState(true)

  const { handleError } = useErrorHandler()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${env.serverApiEndpoint}/notifications/list`, {
          withCredentials: true,
        })

        if (res.status !== 200) {
          toast.error("Failed to fetch notifications")
          return
        }

        setNotifications(res.data.notifications)
        setLoading(false)

        // Optional delay
        await new Promise((res) => setTimeout(res, 3000))

        const unseen: INotification[] = res.data.notifications.filter((n: INotification) => !n.seen)
        if (unseen.length) {
          await axios.patch(
            `${env.serverApiEndpoint}/notifications/mark-seen`,
            { ids: unseen.map((n) => n._id) },
            { withCredentials: true }
          )
          setNotifications((prev) =>
            prev.map((n) => (unseen.some((u) => u._id === n._id) ? { ...n, seen: true } : n))
          )
        }
      } catch (err) {
        handleError(err as AxiosError | Error, "Failed to load notifications", undefined, undefined, "Fetch failed")
      }
    }

    load()
  }, [])

  return (
    <div>
      {loading && <p>Loading notifications...</p>}
      {notifications.map((n) => (
        <NotificationCard
          key={n._id || n._redisId}
          _redisId={n._redisId}
          actorUsernames={n.actorUsernames}
          post={n.post}
          _id={n._id}
          content={n.content}
          receiverId={n.receiverId}
          seen={n.seen}
          type={n.type}
          _retries={n._retries}
        />
      ))}
    </div>
  )
}

export default NotificationsPage