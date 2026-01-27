import { IoMdNotifications } from "react-icons/io";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import Link from "next/link";

function NotificationButton() {
  const notificationCount = useNotificationSocket()

  return (
    <Link className="relative" href="/notifications">
      <IoMdNotifications />
      {notificationCount > 0
        && <span className="absolute top-0 right-0 text-xs w-4 h-4 flex justify-center items-center bg-red-500 text-zinc-100 rounded-full">
          {notificationCount}
        </span>
      }
    </Link>
  )
}

export default NotificationButton