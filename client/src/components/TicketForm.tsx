import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { CalendarIcon, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/context/AuthContext";
import { employeeTicketsApi, type TicketCategories, type CreateAttendanceCorrectionTicketData, type CreateExtraLeaveTicketData, type CreateProfileChangeTicketData } from "@/services/api/tickets";
import { getAttendanceHistory, type Attendance } from "@/services/api/attendance";
import { extractErrorMessage } from "@/lib/utils";
import { z } from "zod";

// Simple form schema - no dynamic validation
const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  
  // Optional fields for all ticket types
  attendanceId: z.string().optional(),
  requestedDate: z.string().optional(),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
  leaveType: z.string().optional(),
  leaveStartDate: z.string().optional(),
  leaveEndDate: z.string().optional(),
  leaveDays: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: "medium",
      category: "",
      title: "",
      description: "",
      attendanceId: "",
      requestedDate: "",
      requestedCheckIn: "",
      requestedCheckOut: "",
      leaveType: "",
      leaveStartDate: "",
      leaveEndDate: "",
      leaveDays: 1,
    },
    mode: "onChange",
  });

  // Load attendance history when needed
  const loadAttendanceHistory = useCallback(async () => {
    if (!accessToken) return;

    try {
      console.log("🕒 Loading attendance history...");
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await getAttendanceHistory(accessToken, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      console.log("🕒 Attendance history loaded:", data.attendances);
      setAttendanceHistory(data.attendances || []);
    } catch (err: any) {
      console.error("Failed to load attendance history:", err);
      setAttendanceHistory([]);
    }
  }, [accessToken]);

  useEffect(() => {
    if (ticketType === "attendance_correction" && accessToken) {
      loadAttendanceHistory();
    }
  }, [ticketType, accessToken, loadAttendanceHistory]);

  // Reset form when ticket type changes
  useEffect(() => {
    form.setValue("category", "");
    form.setValue("title", "");
    form.setValue("description", "");
    setSelectedDate(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setError(null);
  }, [ticketType, form]);

  // Calculate leave days
  useEffect(() => {
    if (startDate && endDate && ticketType === "extra_leave_request") {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      form.setValue("leaveDays", diffDays);
    }
  }, [startDate, endDate, ticketType, form]);

  const onSubmit = async (data: FormData) => {
    if (!accessToken) {
      setError("Authentication required. Please log in again.");
      return;
    }

    console.log("🎫 Form submission started");
    console.log("🎫 Raw form data:", data);
    console.log("🎫 Current ticket type:", ticketType);
    console.log("🎫 Form watch values:", {
      category: form.watch("category"),
      title: form.watch("title"),
      description: form.watch("description"),
      priority: form.watch("priority"),
      requestedDate: form.watch("requestedDate"),
    });

    // Manual validation and data collection
    const category = form.watch("category");
    const title = form.watch("title");
    const description = form.watch("description");
    const priority = form.watch("priority") || "medium";

    if (!category) {
      setError("Category is required");
      return;
    }
    if (!title) {
      setError("Title is required");
      return;
    }
    if (!description || description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      switch (ticketType) {
        case "attendance_correction": {
          const requestedDate = form.watch("requestedDate");
          if (!requestedDate) {
            setError("Date is required for attendance correction");
            return;
          }

          const attendanceData: CreateAttendanceCorrectionTicketData = {
            category,
            title,
            description,
            priority,
            requestedDate,
            ...(form.watch("attendanceId") && form.watch("attendanceId") !== "-" && { 
              attendanceId: parseInt(form.watch("attendanceId")!) 
            }),
            ...(form.watch("requestedCheckIn") && { requestedCheckIn: form.watch("requestedCheckIn") }),
            ...(form.watch("requestedCheckOut") && { requestedCheckOut: form.watch("requestedCheckOut") }),
            attachments: [],
          };
          console.log("🎫 Final attendance correction data being sent:", JSON.stringify(attendanceData, null, 2));
          await employeeTicketsApi.createAttendanceCorrectionTicket(accessToken, attendanceData);
          break;
        }
        case "extra_leave_request": {
          const leaveType = form.watch("leaveType");
          const leaveStartDate = form.watch("leaveStartDate");
          const leaveEndDate = form.watch("leaveEndDate");

          if (!leaveType || !leaveStartDate || !leaveEndDate) {
            setError("Leave type, start date, and end date are required");
            return;
          }

          const leaveData: CreateExtraLeaveTicketData = {
            category,
            title,
            description,
            priority,
            leaveType,
            leaveStartDate,
            leaveEndDate,
            attachments: [],
          };
          console.log("🎫 Final extra leave data being sent:", JSON.stringify(leaveData, null, 2));
          await employeeTicketsApi.createExtraLeaveTicket(accessToken, leaveData);
          break;
        }
        case "profile_change_request": {
          const profileData: CreateProfileChangeTicketData = {
            category,
            title,
            description,
            priority,
            profileChanges: { description },
            attachments: [],
          };
          console.log("🎫 Final profile change data being sent:", JSON.stringify(profileData, null, 2));
          await employeeTicketsApi.createProfileChangeTicket(accessToken, profileData);
          break;
        }
      }

      console.log("🎫 Ticket created successfully");
      onSuccess();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("🎫 Failed to create ticket:", err);
      console.error("🎫 Error response data:", err.response?.data);
      console.error("🎫 Error response status:", err.response?.status);
      console.error("🎫 Error response headers:", err.response?.headers);
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
                    <Label>Category</Label>
                    <Select
                      value={form.watch("category")}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
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
                    <Label>Priority</Label>
                    <Select
                      value={form.watch("priority")}
                      onValueChange={(value) => form.setValue("priority", value as any)}
                    >
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
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
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
                            const dateString = format(date, "yyyy-MM-dd");
                            form.setValue("requestedDate", dateString);
                          } else {
                            form.setValue("requestedDate", "");
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.requestedDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.requestedDate.message}</p>
                  )}
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label>Existing Attendance Record (Optional)</Label>
                    <Select
                      value={form.watch("attendanceId") || "-"}
                      onValueChange={(value) => form.setValue("attendanceId", value === "-" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attendance record (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">No existing record</SelectItem>
                        {attendanceHistory
                          .filter(att => {
                            if (!selectedDate) return false;
                            try {
                              const attDate = format(new Date(att.date), "yyyy-MM-dd");
                              const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
                              return attDate === selectedDateStr;
                            } catch (error) {
                              return false;
                            }
                          })
                          .map((attendance) => (
                            <SelectItem key={attendance.id} value={attendance.id.toString()}>
                              {format(new Date(attendance.date), "PPP")} -
                              {attendance.checkIn ? ` In: ${format(new Date(attendance.checkIn), "HH:mm")}` : " No check-in"}
                              {attendance.checkOut ? ` Out: ${format(new Date(attendance.checkOut), "HH:mm")}` : " No check-out"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requested Check-in Time</Label>
                    <Input
                      type="time"
                      value={form.watch("requestedCheckIn") || ""}
                      onChange={(e) => form.setValue("requestedCheckIn", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Requested Check-out Time</Label>
                    <Input
                      type="time"
                      value={form.watch("requestedCheckOut") || ""}
                      onChange={(e) => form.setValue("requestedCheckOut", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief title for your request"
                    value={form.watch("title") || ""}
                    onChange={(e) => form.setValue("title", e.target.value)}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Explain the reason for this attendance correction..."
                    rows={4}
                    value={form.watch("description") || ""}
                    onChange={(e) => form.setValue("description", e.target.value)}
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
                    <Label>Category</Label>
                    <Select
                      value={form.watch("category")}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
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
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={form.watch("priority")}
                      onValueChange={(value) => form.setValue("priority", value as any)}
                    >
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
                  <Label>Leave Type</Label>
                  <Select
                    value={form.watch("leaveType") || ""}
                    onValueChange={(value) => form.setValue("leaveType", value)}
                  >
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
                  {form.formState.errors.leaveType && (
                    <p className="text-sm text-destructive">{form.formState.errors.leaveType.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
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
                              const dateString = format(date, "yyyy-MM-dd");
                              form.setValue("leaveStartDate", dateString);
                            } else {
                              form.setValue("leaveStartDate", "");
                            }
                          }}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.leaveStartDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.leaveStartDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
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
                              const dateString = format(date, "yyyy-MM-dd");
                              form.setValue("leaveEndDate", dateString);
                            } else {
                              form.setValue("leaveEndDate", "");
                            }
                          }}
                          disabled={(date) => date < (startDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.leaveEndDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.leaveEndDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Days</Label>
                    <Input
                      type="number"
                      readOnly
                      value={form.watch("leaveDays") || 1}
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief title for your leave request"
                    value={form.watch("title") || ""}
                    onChange={(e) => form.setValue("title", e.target.value)}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Explain the reason for this leave request..."
                    rows={4}
                    value={form.watch("description") || ""}
                    onChange={(e) => form.setValue("description", e.target.value)}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                  )}
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
                    <Label>Category</Label>
                    <Select
                      value={form.watch("category")}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
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
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={form.watch("priority")}
                      onValueChange={(value) => form.setValue("priority", value as any)}
                    >
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
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief title for your profile change request"
                    value={form.watch("title") || ""}
                    onChange={(e) => form.setValue("title", e.target.value)}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the changes you want to make to your profile..."
                    rows={4}
                    value={form.watch("description") || ""}
                    onChange={(e) => form.setValue("description", e.target.value)}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                  )}
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
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                console.log("🎫 DEBUG - Current form values:");
                console.log("Category:", form.watch("category"));
                console.log("Title:", form.watch("title"));
                console.log("Description:", form.watch("description"));
                console.log("Priority:", form.watch("priority"));
                console.log("RequestedDate:", form.watch("requestedDate"));
                console.log("All form values:", form.getValues());
                console.log("Form errors:", form.formState.errors);
                console.log("Form is valid:", form.formState.isValid);
              }}
            >
              Debug Values
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