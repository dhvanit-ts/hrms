import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Clock, Calendar, User, FileText, AlertCircle, CheckCircle, XCircle, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/shared/context/AuthContext";
import { employeeTicketsApi, adminTicketsApi, type Ticket, type TicketComment } from "@/services/api/tickets";
import { extractErrorMessage } from "@/lib/utils";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().default(false),
});

const statusUpdateSchema = z.object({
  status: z.enum(["approved", "rejected", "under_review", "cancelled"]),
  approverNotes: z.string().optional(),
});

type CommentFormData = z.infer<typeof commentSchema>;
type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;

interface TicketDetailProps {
  ticket: Ticket;
  isAdmin?: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TicketDetail({ ticket, isAdmin = false, onClose, onUpdate }: TicketDetailProps) {
  const { employeeAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);

  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      isInternal: false,
    },
  });

  const statusForm = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "under_review":
        return "default";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "under_review":
        return <AlertCircle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attendance_correction":
        return <Clock className="h-4 w-4" />;
      case "extra_leave_request":
        return <Calendar className="h-4 w-4" />;
      case "profile_change_request":
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const onSubmitComment = async (data: CommentFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        await adminTicketsApi.addComment(ticket.id, data);
      } else {
        if (!employeeAccessToken) return;
        await employeeTicketsApi.addComment(employeeAccessToken, ticket.id, data);
      }

      commentForm.reset();
      setShowCommentForm(false);
      onUpdate();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to add comment:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitStatusUpdate = async (data: StatusUpdateFormData) => {
    try {
      setLoading(true);
      setError(null);

      await adminTicketsApi.updateTicketStatus(ticket.id, data);

      statusForm.reset();
      setShowStatusForm(false);
      onUpdate();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to update ticket status:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderAttendanceCorrectionDetails = () => {
    if (ticket.type !== "attendance_correction") return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Attendance Correction Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Requested Date</Label>
              <p className="text-sm">
                {ticket.requestedDate ? format(new Date(ticket.requestedDate), "PPP") : "N/A"}
              </p>
            </div>
            {ticket.attendance && (
              <div>
                <Label className="text-sm font-medium">Existing Record</Label>
                <p className="text-sm">
                  {ticket.attendance.checkIn ? format(new Date(ticket.attendance.checkIn), "HH:mm") : "No check-in"} -
                  {ticket.attendance.checkOut ? format(new Date(ticket.attendance.checkOut), "HH:mm") : "No check-out"}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Requested Check-in</Label>
              <p className="text-sm">
                {ticket.requestedCheckIn ? format(new Date(`2000-01-01T${ticket.requestedCheckIn}`), "HH:mm") : "No change"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Requested Check-out</Label>
              <p className="text-sm">
                {ticket.requestedCheckOut ? format(new Date(`2000-01-01T${ticket.requestedCheckOut}`), "HH:mm") : "No change"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLeaveRequestDetails = () => {
    if (ticket.type !== "extra_leave_request") return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Leave Request Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Leave Type</Label>
              <p className="text-sm capitalize">{ticket.leaveType || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Duration</Label>
              <p className="text-sm">{ticket.leaveDays || 0} days</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Start Date</Label>
              <p className="text-sm">
                {ticket.leaveStartDate ? format(new Date(ticket.leaveStartDate), "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">End Date</Label>
              <p className="text-sm">
                {ticket.leaveEndDate ? format(new Date(ticket.leaveEndDate), "PPP") : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProfileChangeDetails = () => {
    if (ticket.type !== "profile_change_request") return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Change Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm font-medium">Requested Changes</Label>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="text-sm whitespace-pre-wrap">
                {ticket.profileChanges ? JSON.stringify(ticket.profileChanges, null, 2) : "No changes specified"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          {getTypeIcon(ticket.type)}
          <span>{ticket.ticketNumber} - {ticket.title}</span>
        </DialogTitle>
      </DialogHeader>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Employee</Label>
              <p className="text-sm">{ticket.employee.name} ({ticket.employee.employeeId})</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Type</Label>
              <p className="text-sm capitalize">{ticket.type.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant={getStatusBadgeVariant(ticket.status)} className="flex items-center space-x-1 w-fit mt-1">
                {getStatusIcon(ticket.status)}
                <span className="capitalize">{ticket.status.replace(/_/g, " ")}</span>
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="capitalize mt-1">
                {ticket.priority}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <p className="text-sm capitalize">{ticket.category.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm mt-1 p-3 bg-muted rounded-md">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm">{format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
            </div>
            {ticket.approver && (
              <div>
                <Label className="text-sm font-medium">Approver</Label>
                <p className="text-sm">{ticket.approver.name} ({ticket.approver.employeeId})</p>
              </div>
            )}
          </div>
          {ticket.approverNotes && (
            <div>
              <Label className="text-sm font-medium">Approver Notes</Label>
              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{ticket.approverNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type-specific details */}
      {renderAttendanceCorrectionDetails()}
      {renderLeaveRequestDetails()}
      {renderProfileChangeDetails()}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Comments ({ticket.comments?.length || 0})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommentForm(!showCommentForm)}
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCommentForm && (
            <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label htmlFor="content">Comment</Label>
                <Textarea
                  placeholder="Add your comment..."
                  rows={3}
                  {...commentForm.register("content")}
                />
                {commentForm.formState.errors.content && (
                  <p className="text-sm text-destructive">{commentForm.formState.errors.content.message}</p>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    {...commentForm.register("isInternal")}
                  />
                  <Label htmlFor="isInternal" className="text-sm">Internal note (not visible to employee)</Label>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCommentForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </form>
          )}

          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-3">
              {ticket.comments
                .filter(comment => isAdmin || !comment.isInternal)
                .map((comment) => (
                  <div key={comment.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {comment.authorType === "employee" ? "Employee" : "Admin"}
                        </span>
                        {comment.isInternal && (
                          <Badge variant="outline" className="text-xs">Internal</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "PPP 'at' p")}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin && ticket.status !== "approved" && ticket.status !== "rejected" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {!showStatusForm ? (
              <Button onClick={() => setShowStatusForm(true)}>
                Update Status
              </Button>
            ) : (
              <form onSubmit={statusForm.handleSubmit(onSubmitStatusUpdate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => statusForm.setValue("status", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {statusForm.formState.errors.status && (
                      <p className="text-sm text-destructive">{statusForm.formState.errors.status.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approverNotes">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    rows={3}
                    {...statusForm.register("approverNotes")}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowStatusForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}