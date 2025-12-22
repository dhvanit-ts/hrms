import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, Clock, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { shiftsApi, type Shift } from "@/services/api/shifts";
import { employeesApi, type Employee } from "@/services/api/employees";

interface AssignShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onShiftAssigned: () => void;
}

export function AssignShiftDialog({
  open,
  onOpenChange,
  employee,
  onShiftAssigned,
}: AssignShiftDialogProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingShifts, setFetchingShifts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setFetchingShifts(true);
      setError(null);
      const response = await shiftsApi.getAll(false); // Only active shifts
      setShifts(response.shifts);
    } catch (err: any) {
      setError("Failed to fetch shifts");
      console.error("Error fetching shifts:", err);
    } finally {
      setFetchingShifts(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchShifts();
      // Set current shift if employee has one
      if (employee.shift) {
        setSelectedShiftId(employee.shift.id.toString());
      } else {
        setSelectedShiftId("");
      }
    }
  }, [open, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedShiftId === "") {
        // Remove shift assignment
        await employeesApi.update(employee.id, { shiftId: null });
      } else {
        // Assign new shift
        await employeesApi.update(employee.id, { shiftId: parseInt(selectedShiftId) });
      }
      onShiftAssigned();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign shift");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const selectedShift = shifts.find(shift => shift.id.toString() === selectedShiftId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Assign Shift to {employee.name}
          </DialogTitle>
          <DialogDescription>
            Select a shift to assign to this employee. Leave empty to remove current shift assignment.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shift">Select Shift</Label>
            {fetchingShifts ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading shifts...
              </div>
            ) : (
              <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a shift or leave empty to remove assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">No Shift (Remove Assignment)</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{shift.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedShift && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="font-medium mb-2">{selectedShift.name}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Break time: {selectedShift.breakTime} minutes
                </div>
                {selectedShift.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedShift.description}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingShifts}>
              {loading ? "Assigning..." : "Assign Shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}