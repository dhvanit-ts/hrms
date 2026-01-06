import React, { useState, useEffect } from "react";
import { useAuth } from "../shared/context/AuthContext.js";
import { useNotifications } from "../shared/context/NotificationContext.js";

export const SSEDebugInfo: React.FC = () => {
  const { user, employee, accessToken, employeeAccessToken, isEmployee } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [isMinimized, setIsMinimized] = useState(false);
  const [sseStatus, setSSEStatus] = useState<'unknown' | 'connecting' | 'connected' | 'error'>('unknown');

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const currentUserId = isEmployee ? employee?.id : user?.id;
  const currentUserType = isEmployee ? "employee" : "user";
  const currentToken = isEmployee ? employeeAccessToken : accessToken;

  // Monitor SSE connection
  useEffect(() => {
    const checkSSEConnection = () => {
      // Simple check - in real implementation you'd track the actual EventSource
      if (currentToken && currentUserId) {
        setSSEStatus('connected');
      } else {
        setSSEStatus('error');
      }
    };

    checkSSEConnection();
    const interval = setInterval(checkSSEConnection, 3000);
    return () => clearInterval(interval);
  }, [currentToken, currentUserId]);

  const getStatusColor = () => {
    switch (sseStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-lg text-xs cursor-pointer z-50 flex items-center gap-2"
        onClick={() => setIsMinimized(false)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span>SSE Debug</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          SSE Debug Info
        </h4>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div className="border-b border-gray-600 pb-1 mb-2">
          <p><strong>Connection:</strong> <span className={sseStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{sseStatus}</span></p>
        </div>

        <p><strong>User ID:</strong> {currentUserId || 'None'}</p>
        <p><strong>User Type:</strong> {currentUserType}</p>
        <p><strong>Has Token:</strong> {currentToken ? 'Yes' : 'No'}</p>
        <p><strong>Token Length:</strong> {currentToken?.length || 0}</p>

        <div className="border-t border-gray-600 pt-1 mt-2">
          <p><strong>Notifications:</strong> {notifications.length}</p>
          <p><strong>Unread Count:</strong> {unreadCount}</p>
        </div>

        <div className="border-t border-gray-600 pt-1 mt-2">
          <p><strong>Is Employee:</strong> {isEmployee ? 'Yes' : 'No'}</p>
          {user && (
            <p><strong>Admin Roles:</strong> {user.roles?.join(', ') || 'None'}</p>
          )}
          {employee && (
            <p><strong>Employee ID:</strong> {employee.employeeId}</p>
          )}
        </div>

        {/* Recent notifications */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-600 pt-1 mt-2">
            <p><strong>Latest:</strong></p>
            <div className="text-xs text-gray-300 max-h-20 overflow-y-auto">
              {notifications.slice(0, 2).map((notif, i) => (
                <div key={notif.id} className="mb-1">
                  {notif.type} - {notif.state}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-2 pt-1 border-t border-gray-600">
          API: {(import.meta as any).env?.VITE_API_URL || "http://localhost:4000"}
        </div>
      </div>
    </div>
  );
};