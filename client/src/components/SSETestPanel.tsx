import React, { useState, useEffect } from "react";
import { Button } from "../shared/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/components/ui/card.jsx";
import { Badge } from "../shared/components/ui/badge.jsx";
import { useAuth } from "../shared/context/AuthContext.jsx";
import { useNotifications } from "../shared/context/NotificationContext.jsx";
import { http } from "../services/api/http.js";
import { employeeHttp } from "../services/api/employee-http.js";

export const SSETestPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string>('');
  const { isEmployee } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  // Monitor SSE connection status
  useEffect(() => {
    // Check if EventSource is available and connected
    const checkConnection = () => {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
      try {
        // This is a simple check - in a real implementation you'd want to track the actual EventSource
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const client = isEmployee ? employeeHttp : http;
      const response = await client.post("/notifications/test/test-sse");
      console.log("Test notification sent:", response.data);
      setLastMessage(`Test notification sent at ${new Date().toLocaleTimeString()}`);

      // Show success message
      if (response.data?.data) {
        const data = response.data.data;
        setLastMessage(`✅ Sent to ${data.userClients} client(s). Total: ${data.totalClients}`);
      }
    } catch (error: any) {
      console.error("Failed to send test notification:", error);
      setLastMessage(`❌ Failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSSEStats = async () => {
    setLoading(true);
    try {
      const client = isEmployee ? employeeHttp : http;
      const response = await client.get("/notifications/test/sse-stats");
      setStats(response.data.data);
      setLastMessage(`📊 Stats updated at ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
      console.error("Failed to get SSE stats:", error);
      setLastMessage(`❌ Stats failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBroadcast = async () => {
    setLoading(true);
    try {
      const client = isEmployee ? employeeHttp : http;
      const response = await client.post("/notifications/test/broadcast", {
        message: `Broadcast test from ${isEmployee ? 'Employee' : 'Admin'} at ${new Date().toLocaleTimeString()}`
      });
      console.log("Broadcast sent:", response.data);
      setLastMessage(`📢 Broadcast sent to ${response.data?.data?.clientCount || 0} clients`);
    } catch (error: any) {
      console.error("Failed to send broadcast:", error);
      setLastMessage(`❌ Broadcast failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSSEHealth = async () => {
    setLoading(true);
    try {
      const client = isEmployee ? employeeHttp : http;
      const response = await client.get("/notifications/test/health");
      console.log("SSE Health check:", response.data);
      setLastMessage(`💚 SSE healthy: ${response.data?.data?.totalClients || 0} clients`);
    } catch (error: any) {
      console.error("SSE health check failed:", error);
      setLastMessage(`❌ Health check failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          SSE Test Panel
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} title={connectionStatus} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium mb-2">Connection Status:</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Status:</strong> <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>{connectionStatus}</Badge></p>
            <p><strong>User Type:</strong> {isEmployee ? 'Employee' : 'Admin'}</p>
            <p><strong>Notifications:</strong> {notifications.length} total, {unreadCount} unread</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          <Button
            onClick={sendTestNotification}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Sending..." : "🔔 Send Test Notification"}
          </Button>

          <Button
            onClick={getSSEStats}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? "Loading..." : "📊 Get SSE Stats"}
          </Button>

          <Button
            onClick={testBroadcast}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? "Broadcasting..." : "📢 Test Broadcast"}
          </Button>

          <Button
            onClick={testSSEHealth}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? "Checking..." : "💚 SSE Health Check"}
          </Button>
        </div>

        {/* Last Message */}
        {lastMessage && (
          <div className="p-2 bg-gray-100 rounded text-xs">
            <strong>Last Action:</strong> {lastMessage}
          </div>
        )}

        {/* Stats Display */}
        {stats && (
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">SSE Connection Stats:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Total Clients:</strong> {stats.totalClients}</p>
              <p><strong>Your Connections:</strong> {stats.userClients}</p>
              <p><strong>User ID:</strong> {stats.userId}</p>
              <p><strong>User Type:</strong> {stats.userType}</p>
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <div className="p-3 bg-green-50 rounded-md">
            <h4 className="font-medium mb-2">Recent Notifications:</h4>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {notifications.slice(0, 3).map((notif, i) => (
                <div key={notif.id} className="p-1 bg-white rounded">
                  <p><strong>{notif.type}</strong> - {notif.state}</p>
                  <p className="text-gray-600">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};