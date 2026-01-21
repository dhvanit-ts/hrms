import { IoMdNotifications } from "react-icons/io";
import { Link } from "react-router-dom";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

function NotificationButton() {
  const notificationCount = useNotificationSocket()

  return (
    <Link className="relative" to="/notifications">
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