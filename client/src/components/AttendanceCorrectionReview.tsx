import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Clock,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import {
  attendanceCorrectionAdminApi,
  AttendanceCorrectionRequest,
  ReviewCorrectionRequestData
} from "@/services/api/attendance-corrections";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewerNotes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface AttendanceCorrectionReviewProps {
  refreshTrigger?: number;
}

export function AttendanceCorrectionReview({ refreshTrigger }: AttendanceCorrectionReviewProps) {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = statusFilter !== "all" ? { status: statusFilter as any } : {};
      const data = await attendanceCorrectionAdminApi.getAllRequests(filters);
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch correction requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, refreshTrigger]);

  const handleReview = async (requestId: number, data: ReviewFormData) => {
    try {
      setSubmitting(true);
      await attendanceCorrectionAdminApi.reviewRequest(requestId, data);

      // Update the request in the local state
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: data.status, reviewerNotes: data.reviewerNotes, reviewedAt: new Date().toISOString() }
          : req
      ));

      setReviewingId(null);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to review request");
    } finally {
      setSubmitting(false);
    }
  };

  const startReview = (requestId: number) => {
    setReviewingId(requestId);
    reset();
    setError(null);
  };

  const cancelReview = () => {
    setReviewingId(null);
    reset();
    setError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Attendance Correction Requests</span>
              </CardTitle>
              <CardDescription>
                Review and approve/reject employee attendance correction requests
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No correction requests found</p>
              <p className="text-sm">
                {statusFilter !== "all"
                  ? `No ${statusFilter} requests to display`
                  : "No attendance correction requests have been submitted"
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
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{request.employee.name}</span>
                        <span className="text-sm text-gray-500">({request.employee.employeeId})</span>
                      </div>
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
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>Check-in: {formatDateTime(request.requestedCheckIn)}</p>
                        <p>Check-out: {formatDateTime(request.requestedCheckOut)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Employee's Reason</span>
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {request.reason}
                    </p>
                  </div>

                  {/* Reviewer Notes (if reviewed) */}
                  {request.reviewerNotes && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>Reviewer Notes</span>
                      </h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                        {request.reviewerNotes}
                      </p>
                    </div>
                  )}

                  {/* Review Actions */}
                  {request.status === "pending" && (
                    <div className="border-t pt-4">
                      {reviewingId === request.id ? (
                        <form onSubmit={handleSubmit((data) => handleReview(request.id, data))} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Decision</Label>
                              <Select onValueChange={(value) => setValue("status", value as any)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select decision" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span>Approve</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="rejected">
                                    <div className="flex items-center space-x-2">
                                      <XCircle className="h-4 w-4 text-red-600" />
                                      <span>Reject</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.status && (
                                <p className="text-sm text-red-600">{errors.status.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="reviewerNotes">Notes (Optional)</Label>
                            <Textarea
                              {...register("reviewerNotes")}
                              placeholder="Add any notes about your decision..."
                              rows={3}
                            />
                            {errors.reviewerNotes && (
                              <p className="text-sm text-red-600">{errors.reviewerNotes.message}</p>
                            )}
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              type="submit"
                              disabled={submitting}
                              className="flex-1"
                            >
                              {submitting ? "Submitting..." : "Submit Review"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={cancelReview}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => startReview(request.id)}
                            variant="outline"
                          >
                            Review Request
                          </Button>
                        </div>
                      )}
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