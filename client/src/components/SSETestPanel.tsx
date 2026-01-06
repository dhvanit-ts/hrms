import React, { useState } from "react";
import { Button } from "../shared/components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/components/ui/card.js";
import { useAuth } from "../shared/context/AuthContext.js";
import { http } from "../services/api/http.js";
import { employeeHttp } from "../services/api/employee-http.js";

export const SSETestPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { isEmployee } = useAuth();

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const client = isEmployee ? employeeHttp : http;
      const response = await client.post("/notifications/test/test-sse");
      console.log("Test notification sent:", response.data);
      alert("Test notification sent! Check your notification bell.");
    } catch (error) {
      console.error("Failed to send test notification:", error);
      alert("Failed to send test notification. Check console for details.");
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
    } catch (error) {
      console.error("Failed to get SSE stats:", error);
      alert("Failed to get SSE stats. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>SSE Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={sendTestNotification}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Sending..." : "Send Test Notification"}
        </Button>

        <Button
          onClick={getSSEStats}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? "Loading..." : "Get SSE Stats"}
        </Button>

        {stats && (
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">SSE Connection Stats:</h4>
            <p className="text-sm">Total Clients: {stats.totalClients}</p>
            <p className="text-sm">Your Connections: {stats.userClients}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};