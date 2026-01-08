import * as notificationAdapter from "@/infra/db/adapters/notification.adapter";

const NotificationRepo = {
  Read: {
    getLatestNotifications: notificationAdapter.getLatestNotifications,
    getAllNotifications: notificationAdapter.getAllNotifications,
    getAllJoinedNotifications: notificationAdapter.getAllJoinedNotifications,
  },
  CachedRead: {
    getLatestNotifications: notificationAdapter.getLatestNotifications,
    getAllNotifications: notificationAdapter.getAllNotifications,
    getAllJoinedNotifications: notificationAdapter.getAllJoinedNotifications,
  },
  Write: {
    create: notificationAdapter.create,
    markNotificationsAsSeen: notificationAdapter.markNotificationsAsSeen,
  },
};

export default NotificationRepo;