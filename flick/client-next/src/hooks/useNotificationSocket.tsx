import { useEffect, useState } from "react"
import useSocket from "@/socket/useSocket"
import useProfileStore from "@/store/profileStore"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import getNotificationAction from "@/utils/getNotificationAction"
import { INotification } from "@/types/Notification"

export function useNotificationSocket() {
  const [notificationCount, setNotificationCount] = useState(0)
  const socket = useSocket()
  const navigate = useNavigate()

  useEffect(() => {
    if (!socket) return;

    const profile = useProfileStore.getState().profile;
    if (!profile?._id) return;

    socket.emit("initial-setup", { userId: profile._id });

    const handleNotification = (notification: { actorUsername: string, type: INotification["type"], postId: string }) => {
      toast.success(`${notification.actorUsername} ${getNotificationAction(notification.type)}`, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => navigate(`/p/${notification.postId}`),
        },
      });
    };

    const handleNotificationCount = (notification: { count: number }) => {
      setNotificationCount(notification.count);
    };

    socket.on("notification", handleNotification);
    socket.on("notification-count", handleNotificationCount);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("notification-count", handleNotificationCount);
    }
  }, [socket, navigate])

  return notificationCount
}
