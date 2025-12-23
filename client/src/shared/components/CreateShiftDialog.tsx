import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { shiftsApi, type CreateShiftData } from "@/services/api/shifts";

const createShiftSchema = z.object({
  name: z.string().min(1, "Shift name is required").max(100, "Shift name too long"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  breakTime: z.number().min(0, "Break time cannot be negative").max(480, "Break time cannot exceed 8 hours"),
  description: z.string().max(500, "Description too long").optional(),
}).refine((data: any) => {
  // Don't allow same start and end time
  return data.startTime !== data.endTime;
}, {
  message: "Start time and end time cannot be the same",
  path: ["endTime"],
}).refine((data: any) => {
  const duration = calculateShiftDuration(data.startTime, data.endTime);
  return duration >= 60; // At least 1 hour
}, {
  message: "Shift duration must be at least 1 hour",
  path: ["endTime"],
}).refine((data: any) => {
  const duration = calculateShiftDuration(data.startTime, data.endTime);
  return duration <= 1440; // Max 24 hours
}, {
  message: "Shift duration cannot exceed 24 hours",
  path: ["endTime"],
});

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateShiftDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // If end time is less than start time, it's an overnight shift
  if (endMinutes < startMinutes) {
    // Add 24 hours (1440 minutes) to end time for overnight calculation
    return (endMinutes + 1440) - startMinutes;
  }

  return endMinutes - startMinutes;
}

type CreateShiftFormData = z.infer<typeof createShiftSchema>;

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShiftCreated: () => void;
}

export function CreateShiftDialog({ open, onOpenChange, onShiftCreated }: CreateShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateShiftFormData>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      breakTime: 60,
      description: "",
    },
  });

  const onSubmit = async (data: CreateShiftFormData) => {
    try {
      setLoading(true);
      setError(null);

      const createData: CreateShiftData = {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: data.breakTime,
        description: data.description || undefined,
      };

      await shiftsApi.create(createData);
      onShiftCreated();
      form.reset();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create shift");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Shift</DialogTitle>
          <DialogDescription>
            Create a new work shift with specific timing and break duration.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="breakTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="480"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Total break time allowed during the shift
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this shift..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Shift"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}