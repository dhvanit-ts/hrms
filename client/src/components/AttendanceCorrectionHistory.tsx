import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Clock, Calendar, User, MessageSquare, RefreshCw } from "lucide-react";
import { attendanceCorrectionEmployeeApi, AttendanceCorrectionRequest } from "@/services/api/attendance-corrections";

interface AttendanceCorrectionHistoryProps {
  refreshTrigger?: number;
}

export function AttendanceCorrectionHistory({ refreshTrigger }: AttendanceCorrectionHistoryProps) {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = statusFilter !== "all" ? { status: statusFilter as any } : {};
      const data = await attendanceCorrectionEmployeeApi.getMyRequests(filters);

      // Debug logging
      console.log("API Response:", data);

      // Ensure we have an array
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        console.error("Expected array but got:", typeof data, data);
        setRequests([]);
        setError("Invalid response format from server");
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch correction requests");
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "CHECK_IN_TIME":
        return "Check-in Time Correction";
      case "CHECK_OUT_TIME":
        return "Check-out Time Correction";
      case "BOTH_TIMES":
        return "Both Times Correction";
      case "MISSING_CHECK_IN":
        return "Missing Check-in";
      case "MISSING_CHECK_OUT":
        return "Missing Check-out";
      default:
        return type;
    }
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "Not set";
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading correction requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRequests} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Attendance Correction History</span>
              </CardTitle>
              <CardDescription>
                View your submitted attendance correction requests
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchRequests} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No correction requests found</p>
              <p className="text-sm">
                {statusFilter !== "all"
                  ? `No ${statusFilter} requests to display`
                  : "You haven't submitted any attendance correction requests yet"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.isArray(requests) && requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {formatDate(request.attendance.date)}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {getRequestTypeLabel(request.requestType)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Submitted: {formatDateTime(request.createdAt)}</p>
                      {request.reviewedAt && (
                        <p>Reviewed: {formatDateTime(request.reviewedAt)}</p>
                      )}
                    </div>
                  </div>

                  {/* Current vs Requested Times */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Current Times</h4>
                      <div className="space-y-1 text-sm">
                        <p>Check-in: {formatDateTime(request.currentCheckIn)}</p>
                        <p>Check-out: {formatDateTime(request.currentCheckOut)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Requested Times</h4>
                      <div className="space-y-1 text-sm">
                        <p>Check-in: {formatDateTime(request.requestedCheckIn)}</p>
                        <p>Check-out: {formatDateTime(request.requestedCheckOut)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Reason</span>
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {request.reason}
                    </p>
                  </div>

                  {/* Reviewer Notes */}
                  {request.reviewerNotes && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Reviewer Notes</span>
                      </h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                        {request.reviewerNotes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}