import { http } from "./http.js";
import { employeeHttp } from "./employee-http.js";

export interface Notification {
  id: number;
  type: string;
  targetId: string;
  targetType: string;
  actors: string[];
  count: number;
  state: "unread" | "delivered" | "seen";
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Admin/User notifications
export const getNotifications = async (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> => {
  try {
    const response = await http.get("/notifications", { params });
    console.log("API Response for getNotifications:", response.data);

    // The server returns: { statusCode, success, message, data: { notifications, total, unreadCount } }
    const apiData = response.data?.data || response.data || {};
    return {
      notifications: Array.isArray(apiData.notifications) ? apiData.notifications : [],
      total: apiData.total || 0,
      unreadCount: apiData.unreadCount || 0
    };
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0
    };
  }
};

export const markNotificationsAsDelivered = async (notificationIds: number[]): Promise<void> => {
  await http.post("/notifications/mark-delivered", { notificationIds });
};

export const markNotificationsAsSeen = async (notificationIds?: number[]): Promise<void> => {
  await http.post("/notifications/mark-seen", { notificationIds });
};

export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const response = await http.get("/notifications/unread-count");
  const apiData = response.data?.data || response.data || {};
  return { unreadCount: apiData.unreadCount || 0 };
};

// Employee notifications
export const getEmployeeNotifications = async (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> => {
  try {
    const response = await employeeHttp.get("/notifications", { params });
    console.log("API Response for getEmployeeNotifications:", response.data);

    // The server returns: { statusCode, success, message, data: { notifications, total, unreadCount } }
    const apiData = response.data?.data || response.data || {};
    return {
      notifications: Array.isArray(apiData.notifications) ? apiData.notifications : [],
      total: apiData.total || 0,
      unreadCount: apiData.unreadCount || 0
    };
  } catch (error) {
    console.error("Error in getEmployeeNotifications:", error);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0
    };
  }
};

export const markEmployeeNotificationsAsDelivered = async (notificationIds: number[]): Promise<void> => {
  await employeeHttp.post("/notifications/mark-delivered", { notificationIds });
};

export const markEmployeeNotificationsAsSeen = async (notificationIds?: number[]): Promise<void> => {
  await employeeHttp.post("/notifications/mark-seen", { notificationIds });
};

export const getEmployeeUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const response = await employeeHttp.get("/notifications/unread-count");
  const apiData = response.data?.data || response.data || {};
  return { unreadCount: apiData.unreadCount || 0 };
};