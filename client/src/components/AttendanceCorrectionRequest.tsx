import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { attendanceCorrectionEmployeeApi, CreateCorrectionRequestData } from "@/services/api/attendance-corrections";

const correctionRequestSchema = z.object({
  attendanceId: z.number().int().positive(),
  requestType: z.enum(["CHECK_IN_TIME", "CHECK_OUT_TIME", "BOTH_TIMES", "MISSING_CHECK_IN", "MISSING_CHECK_OUT"]),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason cannot exceed 500 characters"),
}).refine((data: any) => {
  // Validate required fields based on request type
  if (data.requestType === "CHECK_IN_TIME" || data.requestType === "MISSING_CHECK_IN") {
    return !!data.requestedCheckIn;
  }
  if (data.requestType === "CHECK_OUT_TIME" || data.requestType === "MISSING_CHECK_OUT") {
    return !!data.requestedCheckOut;
  }
  if (data.requestType === "BOTH_TIMES") {
    return !!data.requestedCheckIn && !!data.requestedCheckOut;
  }
  return true;
}, {
  message: "Required time fields must be provided based on correction type",
  path: ["requestedCheckIn"],
});

type FormData = z.infer<typeof correctionRequestSchema>;

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

interface AttendanceCorrectionRequestProps {
  attendance: AttendanceRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AttendanceCorrectionRequest({
  attendance,
  onSuccess,
  onCancel
}: AttendanceCorrectionRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(correctionRequestSchema),
    defaultValues: {
      attendanceId: attendance.id,
    },
  });

  const requestType = watch("requestType");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const requestData: CreateCorrectionRequestData = {
        attendanceId: data.attendanceId,
        requestType: data.requestType,
        reason: data.reason,
      };

      // Add time fields based on request type
      if (data.requestedCheckIn) {
        requestData.requestedCheckIn = new Date(data.requestedCheckIn).toISOString();
      }
      if (data.requestedCheckOut) {
        requestData.requestedCheckOut = new Date(data.requestedCheckOut).toISOString();
      }

      await attendanceCorrectionEmployeeApi.createRequest(requestData);
      setSubmitSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || "Failed to submit correction request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "Not recorded";
    return new Date(dateTime).toLocaleString();
  };

  const formatDateForInput = (dateTime?: string) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <p className="text-lg font-medium">Request submitted successfully!</p>
          </div>
          <p className="text-center text-gray-600 mt-2">
            Your attendance correction request has been sent to administrators for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Request Attendance Correction</span>
        </CardTitle>
        <CardDescription>
          Submit a request to correct your attendance record for {new Date(attendance.date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Attendance Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Current Attendance Record</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Check In:</span>
              <p className="text-gray-600">{formatDateTime(attendance.checkIn)}</p>
            </div>
            <div>
              <span className="font-medium">Check Out:</span>
              <p className="text-gray-600">{formatDateTime(attendance.checkOut)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="requestType">Correction Type</Label>
            <Select
              onValueChange={(value) => setValue("requestType", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select what needs to be corrected" />
              </SelectTrigger>
              <SelectContent>
                {attendance.checkIn && (
                  <SelectItem value="CHECK_IN_TIME">Correct Check-in Time</SelectItem>
                )}
                {attendance.checkOut && (
                  <SelectItem value="CHECK_OUT_TIME">Correct Check-out Time</SelectItem>
                )}
                {attendance.checkIn && attendance.checkOut && (
                  <SelectItem value="BOTH_TIMES">Correct Both Times</SelectItem>
                )}
                {!attendance.checkIn && (
                  <SelectItem value="MISSING_CHECK_IN">Add Missing Check-in</SelectItem>
                )}
                {!attendance.checkOut && (
                  <SelectItem value="MISSING_CHECK_OUT">Add Missing Check-out</SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.requestType && (
              <p className="text-sm text-red-600">{errors.requestType.message}</p>
            )}
          </div>

          {/* Requested Check-in Time */}
          {(requestType === "CHECK_IN_TIME" || requestType === "BOTH_TIMES" || requestType === "MISSING_CHECK_IN") && (
            <div className="space-y-2">
              <Label htmlFor="requestedCheckIn">
                {requestType === "MISSING_CHECK_IN" ? "Check-in Time" : "Corrected Check-in Time"}
              </Label>
              <Input
                type="datetime-local"
                {...register("requestedCheckIn")}
                defaultValue={requestType === "CHECK_IN_TIME" ? formatDateForInput(attendance.checkIn) : ""}
              />
              {errors.requestedCheckIn && (
                <p className="text-sm text-red-600">{errors.requestedCheckIn.message}</p>
              )}
            </div>
          )}

          {/* Requested Check-out Time */}
          {(requestType === "CHECK_OUT_TIME" || requestType === "BOTH_TIMES" || requestType === "MISSING_CHECK_OUT") && (
            <div className="space-y-2">
              <Label htmlFor="requestedCheckOut">
                {requestType === "MISSING_CHECK_OUT" ? "Check-out Time" : "Corrected Check-out Time"}
              </Label>
              <Input
                type="datetime-local"
                {...register("requestedCheckOut")}
                defaultValue={requestType === "CHECK_OUT_TIME" ? formatDateForInput(attendance.checkOut) : ""}
              />
              {errors.requestedCheckOut && (
                <p className="text-sm text-red-600">{errors.requestedCheckOut.message}</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Correction</Label>
            <Textarea
              {...register("reason")}
              placeholder="Please explain why this correction is needed (e.g., forgot to check in, system error, etc.)"
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !requestType}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}