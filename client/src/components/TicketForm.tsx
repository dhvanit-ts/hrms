import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { CalendarIcon, Clock, User, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/context/AuthContext";
import { employeeTicketsApi, type TicketCategories } from "@/services/api/tickets";
import { getAttendanceHistory, type Attendance } from "@/services/api/attendance";
import { extractErrorMessage } from "@/lib/utils";

// Validation schemas
const attendanceCorrectionSchema = z.object({
  type: z.literal("attendance_correction"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  attendanceId: z.number().optional(),
  requestedDate: z.string().min(1, "Date is required"),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
});

const extraLeaveSchema = z.object({
  type: z.literal("extra_leave_request"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  leaveType: z.string().min(1, "Leave type is required"),
  leaveStartDate: z.string().min(1, "Start date is required"),
  leaveEndDate: z.string().min(1, "End date is required"),
  leaveDays: z.number().min(1, "Leave days must be at least 1"),
});

const profileChangeSchema = z.object({
  type: z.literal("profile_change_request"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  profileChanges: z.record(z.any()).min(1, "At least one change is required"),
});

type FormData = z.infer<typeof attendanceCorrectionSchema> | z.infer<typeof extraLeaveSchema> | z.infer<typeof profileChangeSchema>;

interface TicketFormProps {
  categories: TicketCategories;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TicketForm({ categories, onSuccess, onCancel }: TicketFormProps) {
  const { employeeAccessToken: accessToken } = useAuth();
  const [ticketType, setTicketType] = useState<"attendance_correction" | "extra_leave_request" | "profile_change_request">("attendance_correction");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const getSchema = () => {
    switch (ticketType) {
      case "attendance_correction":
        return attendanceCorrectionSchema;
      case "extra_leave_request":
        return extraLeaveSchema;
      case "profile_change_request":
        return profileChangeSchema;
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      type: ticketType,
      priority: "medium",
    },
  });

  useEffect(() => {
    form.setValue("type", ticketType);
    form.reset({
      type: ticketType,
      priority: "medium",
    });
  }, [ticketType, form]);

  useEffect(() => {
    if (ticketType === "attendance_correction" && accessToken) {
      loadAttendanceHistory();
    }
  }, [ticketType, accessToken]);

  const loadAttendanceHistory = async () => {
    if (!accessToken) return;

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await getAttendanceHistory(accessToken, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      setAttendanceHistory(data.attendances);
    } catch (err: any) {
      console.error("Failed to load attendance history:", err);
    }
  };

  const calculateLeaveDays = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  useEffect(() => {
    if (startDate && endDate && ticketType === "extra_leave_request") {
      const days = calculateLeaveDays(startDate, endDate);
      form.setValue("leaveDays", days);
    }
  }, [startDate, endDate, ticketType, form]);

  const onSubmit = async (data: FormData) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      switch (data.type) {
        case "attendance_correction":
          await employeeTicketsApi.createAttendanceCorrectionTicket(accessToken, data);
          break;
        case "extra_leave_request":
          await employeeTicketsApi.createExtraLeaveTicket(accessToken, data);
          break;
        case "profile_change_request":
          await employeeTicketsApi.createProfileChangeTicket(accessToken, data);
          break;
      }

      onSuccess();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to create ticket:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <Tabs value={ticketType} onValueChange={(value) => setTicketType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance_correction" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="extra_leave_request" className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Leave</span>
          </TabsTrigger>
          <TabsTrigger value="profile_change_request" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TabsContent value="attendance_correction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Correction Request</CardTitle>
                <CardDescription>
                  Request corrections for your attendance records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => form.setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.attendance_correction.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(value) => form.setValue("priority", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedDate">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            form.setValue("requestedDate", format(date, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.requestedDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.requestedDate.message}</p>
                  )}
                </div>

                {selectedDate && attendanceHistory.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Attendance Record</Label>
                    <Select onValueChange={(value) => form.setValue("attendanceId", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attendance record (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {attendanceHistory
                          .filter(att => format(new Date(att.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
                          .map((attendance) => (
                            <SelectItem key={attendance.id} value={attendance.id.toString()}>
                              {format(new Date(attendance.date), "PPP")} -
                              {attendance.checkIn ? format(new Date(attendance.checkIn), "HH:mm") : "No check-in"} to
                              {attendance.checkOut ? format(new Date(attendance.checkOut), "HH:mm") : "No check-out"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestedCheckIn">Requested Check-in Time</Label>
                    <Input
                      type="time"
                      {...form.register("requestedCheckIn")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestedCheckOut">Requested Check-out Time</Label>
                    <Input
                      type="time"
                      {...form.register("requestedCheckOut")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    placeholder="Brief title for your request"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="Explain the reason for this attendance correction..."
                    rows={4}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extra_leave_request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Extra Leave Request</CardTitle>
                <CardDescription>
                  Request additional leave beyond your regular allowance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => form.setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.extra_leave_request.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(value) => form.setValue("priority", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select onValueChange={(value) => form.setValue("leaveType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            if (date) {
                              form.setValue("leaveStartDate", format(date, "yyyy-MM-dd"));
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            if (date) {
                              form.setValue("leaveEndDate", format(date, "yyyy-MM-dd"));
                            }
                          }}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaveDays">Days</Label>
                    <Input
                      type="number"
                      readOnly
                      {...form.register("leaveDays", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    placeholder="Brief title for your leave request"
                    {...form.register("title")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="Explain the reason for this leave request..."
                    rows={4}
                    {...form.register("description")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile_change_request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Change Request</CardTitle>
                <CardDescription>
                  Request changes to your employee profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => form.setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.profile_change_request.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(value) => form.setValue("priority", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    placeholder="Brief title for your profile change request"
                    {...form.register("title")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="Describe the changes you want to make to your profile..."
                    rows={4}
                    {...form.register("description")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profile Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Describe the specific changes you want to make (e.g., phone number, address, emergency contact, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}