import React from "react";
import { useAuth } from "../shared/context/AuthContext.js";
import { useNotifications } from "../shared/context/NotificationContext.js";

export const SSEDebugInfo: React.FC = () => {
  const { user, employee, accessToken, employeeAccessToken, isEmployee } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const currentUserId = isEmployee ? employee?.id : user?.id;
  const currentUserType = isEmployee ? "employee" : "user";
  const currentToken = isEmployee ? employeeAccessToken : accessToken;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">SSE Debug Info</h4>
      <div className="space-y-1">
        <p><strong>User ID:</strong> {currentUserId || 'None'}</p>
        <p><strong>User Type:</strong> {currentUserType}</p>
        <p><strong>Has Token:</strong> {currentToken ? 'Yes' : 'No'}</p>
        <p><strong>Token Length:</strong> {currentToken?.length || 0}</p>
        <p><strong>Notifications:</strong> {notifications.length}</p>
        <p><strong>Unread Count:</strong> {unreadCount}</p>
        <p><strong>Is Employee:</strong> {isEmployee ? 'Yes' : 'No'}</p>
        {user && (
          <p><strong>Admin Roles:</strong> {user.roles?.join(', ') || 'None'}</p>
        )}
        {employee && (
          <p><strong>Employee ID:</strong> {employee.employeeId}</p>
        )}
      </div>
    </div>
  );
};