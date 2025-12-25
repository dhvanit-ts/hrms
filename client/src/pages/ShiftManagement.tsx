import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Clock, Star, StarOff, UserPlus, Timer, Coffee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// API
import { shiftsApi, type Shift, type CreateShiftData, type UpdateShiftData } from '@/services/api/shifts';

// UI Components
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { useToast } from '@/shared/components/ui/use-toast';
import { AssignEmployeesDialog } from '@/shared/components/AssignEmployeesDialog';

const shiftSchema = z.object({
  name: z.string().min(1, "Shift name is required").max(100, "Shift name too long"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  breakTime: z.number().min(0).max(480).optional(),
  description: z.string().max(500).optional(),
});

type ShiftFormData = z.infer<typeof shiftSchema>;

interface ShiftFormProps {
  shift?: Shift;
  onSuccess: () => void;
  onCancel: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shift, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: shift?.name || "",
      startTime: shift?.startTime || "",
      endTime: shift?.endTime || "",
      breakTime: shift?.breakTime || 60,
      description: shift?.description || "",
    },
  });

  const onSubmit = async (data: ShiftFormData) => {
    setIsSubmitting(true);
    try {
      if (shift) {
        await shiftsApi.update(shift.id, data);
        toast({
          title: "Success",
          description: "Shift updated successfully",
        });
      } else {
        await shiftsApi.create(data);
        toast({
          title: "Success",
          description: "Shift created successfully",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save shift",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shift Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Morning Shift" {...field} />
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : shift ? "Update Shift" : "Create Shift"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const ShiftManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [assigningShift, setAssigningShift] = useState<Shift | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await shiftsApi.getAll(includeInactive);
      setShifts(response.shifts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch shifts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [includeInactive]);

  const handleSetDefault = async (shiftId: number) => {
    try {
      await shiftsApi.setDefault(shiftId);
      toast({
        title: "Success",
        description: "Default shift updated successfully",
      });
      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to set default shift",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (shift: Shift) => {
    // Prevent deactivating default shift
    if (shift.isDefault && shift.isActive) {
      toast({
        title: "Cannot Deactivate Default Shift",
        description: "You cannot deactivate the default shift. Please set another shift as default first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await shiftsApi.update(shift.id, { isActive: !shift.isActive });
      toast({
        title: "Success",
        description: `Shift ${shift.isActive ? 'deactivated' : 'activated'} successfully`,
      });
      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update shift status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingShift) return;

    try {
      await shiftsApi.delete(deletingShift.id);
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
      setDeletingShift(null);
      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete shift",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours}h`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shift Management</h1>
            <p className="text-gray-600">Manage work shifts and schedules</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                  </div>
                  <div className="h-16 bg-gray-50 rounded-lg"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shift Management</h1>
          <p className="text-gray-600">Manage work shifts and schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shift</DialogTitle>
                <DialogDescription>
                  Add a new work shift to the system
                </DialogDescription>
              </DialogHeader>
              <ShiftForm
                onSuccess={() => {
                  setShowCreateDialog(false);
                  fetchShifts();
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shifts.map((shift) => (
          <Card key={shift.id} className={`transition-all duration-200 hover:shadow-lg ${!shift.isActive ? 'opacity-60 bg-gray-50' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {shift.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {shift.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="default shift"
                      className="h-8 w-8 p-0 hover:bg-yellow-50"
                    >
                      <Star className="h-4 w-4 text-yellow-600" />
                    </Button>
                  )}
                  {shift.isActive && !shift.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(shift.id)}
                      title="Set as default shift"
                      className="h-8 w-8 p-0 hover:bg-yellow-50"
                    >
                      <StarOff className="h-4 w-4 text-gray-500 hover:text-yellow-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingShift(shift)}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    title="Edit shift"
                  >
                    <Edit className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingShift(shift)}
                    disabled={!!(shift._count?.employees && shift._count.employees > 0) || shift.isDefault}
                    className="h-8 w-8 p-0 hover:bg-red-50 disabled:opacity-50"
                    title={shift.isDefault ? "Cannot delete default shift" : "Delete shift"}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shift Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <div>
                    <span className="text-gray-600">Duration</span>
                    <p className="font-medium text-gray-900">{calculateDuration(shift.startTime, shift.endTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Coffee className="h-4 w-4 text-orange-500" />
                  <div>
                    <span className="text-gray-600">Break</span>
                    <p className="font-medium text-gray-900">{shift.breakTime}m</p>
                  </div>
                </div>
              </div>

              {/* Employee Count */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Assigned Employees</span>
                  <span className="font-bold text-gray-800">({shift._count?.employees || 0})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningShift(shift)}
                  className="h-7 px-2 text-xs hover:bg-blue-50 hover:border-blue-200"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign
                </Button>
              </div>

              {/* Description */}
              {shift.description && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{shift.description}</p>
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Badge
                  variant={shift.isActive ? "default" : "secondary"}
                  className={shift.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"}
                >
                  {shift.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(shift)}
                  disabled={shift.isDefault && shift.isActive}
                  className={`text-xs ${shift.isDefault && shift.isActive
                    ? 'opacity-50 cursor-not-allowed'
                    : shift.isActive
                      ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                      : 'hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                    }`}
                  title={shift.isDefault && shift.isActive ? "Cannot deactivate default shift" : undefined}
                >
                  {shift.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shifts.length === 0 && (
        <div className="col-span-full">
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No shifts found</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Get started by creating your first work shift to organize employee schedules
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Shift
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              Update shift details
            </DialogDescription>
          </DialogHeader>
          {editingShift && (
            <ShiftForm
              shift={editingShift}
              onSuccess={() => {
                setEditingShift(null);
                fetchShifts();
              }}
              onCancel={() => setEditingShift(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingShift} onOpenChange={() => setDeletingShift(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingShift?.name}"? This action cannot be undone.
              {deletingShift?.isDefault && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                  <strong>Cannot delete default shift.</strong> Please set another shift as default before deleting this one.
                </div>
              )}
              {deletingShift?._count?.employees && deletingShift._count.employees > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                  This shift has {deletingShift._count.employees} assigned employee(s).
                  Please reassign them before deleting.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!(deletingShift?._count?.employees && deletingShift._count.employees > 0) || deletingShift?.isDefault}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Employees Dialog */}
      {assigningShift && (
        <AssignEmployeesDialog
          open={!!assigningShift}
          onOpenChange={() => setAssigningShift(null)}
          shift={assigningShift}
          onEmployeesAssigned={() => {
            setAssigningShift(null);
            fetchShifts();
          }}
        />
      )}
    </div>
  );
};

export { ShiftManagementPage };