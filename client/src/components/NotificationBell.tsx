import React, { useState, useMemo } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "../shared/components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../shared/components/ui/dropdown-menu.js";
import { Badge } from "../shared/components/ui/badge.js";
import { ScrollArea } from "../shared/components/ui/scroll-area.js";
import { useNotifications } from "../shared/context/NotificationContext.js";
import { formatDistanceToNow } from "date-fns";

export const NotificationBell: React.FC = React.memo(() => {
  const { notifications, unreadCount, markAsDelivered, markAsSeen, markAllAsSeen, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Memoize expensive calculations
  const unreadAndDeliveredCount = useMemo(() =>
    notifications.filter(n => n.state === "unread" || n.state === "delivered").length,
    [notifications]
  );

  // Memoize unread notification IDs to prevent recalculation
  const unreadNotificationIds = useMemo(() =>
    notifications.filter(n => n.state === "unread").map(n => n.id),
    [notifications]
  );

  const handleMarkAsSeen = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsSeen([notificationId]);
  };

  const handleMarkAllAsSeen = async () => {
    await markAllAsSeen();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadNotificationIds.length > 0) {
      // Mark unread notifications as delivered when dropdown is opened
      // This keeps them visible but changes their state from "unread" to "delivered"
      markAsDelivered(unreadNotificationIds);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadAndDeliveredCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center text-zinc-200 justify-center text-xs"
            >
              {unreadAndDeliveredCount > 99 ? "99+" : unreadAndDeliveredCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadAndDeliveredCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsSeen}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications?.length > 0 ? (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${notification.state === "unread" ? "bg-blue-50" :
                  notification.state === "delivered" ? "bg-gray-50" :
                    "bg-white"
                  }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${notification.state === "seen" ? "text-gray-600" : "text-gray-900"
                      }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      State: {notification.state} | ID: {notification.id}
                    </p>
                    {notification.count > 1 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {notification.count} items
                      </Badge>
                    )}
                  </div>
                  {(notification.state === "unread" || notification.state === "delivered") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkAsSeen(notification.id, e)}
                      className="h-auto p-1 ml-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});