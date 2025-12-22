import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";
import { shiftsApi, type Shift } from "@/services/api/shifts";

interface DeleteShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift;
  onShiftDeleted: () => void;
}

export function DeleteShiftDialog({
  open,
  onOpenChange,
  shift,
  onShiftDeleted,
}: DeleteShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await shiftsApi.delete(shift.id);
      onShiftDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete shift");
    } finally {
      setLoading(false);
    }
  };

  const hasEmployees = shift._count?.employees ? shift._count.employees > 0 : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete Shift
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the shift.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasEmployees && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This shift has {shift._count?.employees} employee(s) assigned.
              You cannot delete a shift with assigned employees.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the shift "{shift.name}"?
          </p>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <div className="text-sm">
              <div><strong>Name:</strong> {shift.name}</div>
              <div><strong>Time:</strong> {shift.startTime} - {shift.endTime}</div>
              <div><strong>Employees:</strong> {shift._count?.employees || 0}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || hasEmployees}
          >
            {loading ? "Deleting..." : "Delete Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}