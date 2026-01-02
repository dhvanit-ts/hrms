import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext.js";
import * as notificationApi from "../../services/api/notifications.js";
import type { Notification } from "../../services/api/notifications.js";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsDelivered: (notificationIds: number[]) => Promise<void>;
  markAsSeen: (notificationIds?: number[]) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { user, employee, accessToken, employeeAccessToken, isEmployee } = useAuth();

  // Stable references to prevent unnecessary re-renders
  const currentUserId = useMemo(() => isEmployee ? employee?.id : user?.id, [isEmployee, employee?.id, user?.id]);
  const currentUserType = useMemo(() => isEmployee ? "employee" : "user", [isEmployee]);
  const currentToken = useMemo(() => isEmployee ? employeeAccessToken : accessToken, [isEmployee, employeeAccessToken, accessToken]);

  // Track if we've already fetched notifications to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<number | string | undefined>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;

    // Prevent duplicate calls for the same user
    if (hasFetchedRef.current && lastUserIdRef.current === currentUserId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = isEmployee
        ? await notificationApi.getEmployeeNotifications({ limit: 20 })
        : await notificationApi.getNotifications({ limit: 20 });

      // Ensure we always set an array with proper validation
      const notifications = response?.notifications;
      if (Array.isArray(notifications)) {
        setNotifications(notifications);
      } else {
        console.warn("Invalid notifications format received:", notifications);
        setNotifications([]);
      }

      setUnreadCount(typeof response?.unreadCount === 'number' ? response.unreadCount : 0);

      // Mark as fetched for this user
      hasFetchedRef.current = true;
      lastUserIdRef.current = currentUserId;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Set empty array on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isEmployee]);

  const markAsDelivered = useCallback(async (notificationIds: number[]) => {
    if (!currentUserId || !notificationIds.length) return;

    try {
      if (isEmployee) {
        await notificationApi.markEmployeeNotificationsAsDelivered(notificationIds);
      } else {
        await notificationApi.markNotificationsAsDelivered(notificationIds);
      }

      // Update local state to mark as delivered (unread count stays the same)
      setNotifications(prev => {
        if (!Array.isArray(prev)) {
          console.warn("Previous notifications state is not an array:", prev);
          return [];
        }

        return prev.map(n =>
          notificationIds.includes(n.id)
            ? { ...n, state: "delivered" as const }
            : n
        );
      });
      // Note: unread count stays the same when marking as delivered - only changes when marked as seen
    } catch (error) {
      console.error("Failed to mark notifications as delivered:", error);
    }
  }, [currentUserId, isEmployee]);

  const markAsSeen = useCallback(async (notificationIds?: number[]) => {
    if (!currentUserId) return;

    try {
      if (isEmployee) {
        await notificationApi.markEmployeeNotificationsAsSeen(notificationIds);
      } else {
        await notificationApi.markNotificationsAsSeen(notificationIds);
      }

      // Update local state with extra safety checks
      if (notificationIds && Array.isArray(notificationIds)) {
        setNotifications(prev => {
          // Ensure prev is always an array
          if (!Array.isArray(prev)) {
            console.warn("Previous notifications state is not an array:", prev);
            return [];
          }

          return prev.map(n =>
            notificationIds.includes(n.id)
              ? { ...n, state: "seen" as const }
              : n
          );
        });
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      } else {
        // Mark all as seen
        setNotifications(prev => {
          // Ensure prev is always an array
          if (!Array.isArray(prev)) {
            console.warn("Previous notifications state is not an array:", prev);
            return [];
          }

          return prev.map(n => ({ ...n, state: "seen" as const }));
        });
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark notifications as seen:", error);
    }
  }, [currentUserId, isEmployee]);

  const markAllAsSeen = useCallback(async () => {
    await markAsSeen();
  }, [markAsSeen]);

  // Socket.IO connection - optimized to prevent unnecessary reconnections
  useEffect(() => {
    if (!currentUserId || !currentToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Don't reconnect if we already have a connected socket for the same user
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

    const newSocket = io(apiUrl, {
      auth: {
        userId: currentUserId,
        userType: currentUserType,
        token: currentToken
      }
    });

    newSocket.on("connect", () => {
      // Connection successful - no logging needed in production
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      // Disconnection - only log errors
      if (reason !== "io client disconnect") {
        console.log("🔌 Disconnected from notification socket:", reason);
      }
    });

    newSocket.on("notification", (notification: any) => {
      // Validate notification object
      if (!notification || typeof notification !== 'object') {
        console.warn("Invalid notification received:", notification);
        return;
      }

      // Add new notification to the list - ensure prev is always an array
      setNotifications(prev => {
        if (!Array.isArray(prev)) {
          console.warn("Previous notifications state is not an array, resetting:", prev);
          return [notification];
        }
        return [notification, ...prev];
      });

      setUnreadCount(prev => (typeof prev === 'number' ? prev + 1 : 1));

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("HRMS Notification", {
          body: notification.message || "New notification",
          icon: "/favicon.ico"
        });
      }
    });

    newSocket.on("unread-count", (data: { unreadCount: number }) => {
      const count = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
      setUnreadCount(count);
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, currentUserType, currentToken]);

  // Request notification permission - only once
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications on mount and user change - optimized
  useEffect(() => {
    if (currentUserId) {
      // Reset fetch tracking when user changes
      if (lastUserIdRef.current !== currentUserId) {
        hasFetchedRef.current = false;
        setNotifications([]);
        setUnreadCount(0);
      }

      // Only fetch if we haven't already fetched for this user
      if (!hasFetchedRef.current || lastUserIdRef.current !== currentUserId) {
        fetchNotifications();
      }
    } else {
      // Clear data when no user
      setNotifications([]);
      setUnreadCount(0);
      hasFetchedRef.current = false;
      lastUserIdRef.current = undefined;
    }
  }, [currentUserId, isEmployee]); // Remove fetchNotifications from dependencies

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<NotificationContextType>(() => ({
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsDelivered,
    markAsSeen,
    markAllAsSeen
  }), [notifications, unreadCount, isLoading, fetchNotifications, markAsDelivered, markAsSeen, markAllAsSeen]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};