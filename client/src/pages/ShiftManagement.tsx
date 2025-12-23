import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { shiftsApi, type Shift } from "@/services/api/shifts";
import { CreateShiftDialog } from "@/shared/components/CreateShiftDialog";
import { EditShiftDialog } from "@/shared/components/EditShiftDialog";
import { DeleteShiftDialog } from "@/shared/components/DeleteShiftDialog";
import { AssignEmployeesDialog } from "@/shared/components/AssignEmployeesDialog";
import { Switch } from "@/shared/components/ui/switch";

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shiftsApi.getAll(includeInactive);
      setShifts(response.shifts);
    } catch (err) {
      setError("Failed to fetch shifts");
      console.error("Error fetching shifts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [includeInactive]);

  const handleCreateShift = () => {
    setCreateDialogOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleDeleteShift = (shift: Shift) => {
    setSelectedShift(shift);
    setDeleteDialogOpen(true);
  };

  const handleAssignEmployees = (shift: Shift) => {
    setSelectedShift(shift);
    setAssignDialogOpen(true);
  };

  const handleShiftCreated = () => {
    fetchShifts();
    setCreateDialogOpen(false);
  };

  const handleShiftUpdated = () => {
    fetchShifts();
    setEditDialogOpen(false);
    setSelectedShift(null);
  };

  const handleShiftDeleted = () => {
    fetchShifts();
    setDeleteDialogOpen(false);
    setSelectedShift(null);
  };

  const handleEmployeesAssigned = () => {
    fetchShifts();
    setAssignDialogOpen(false);
    setSelectedShift(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateShiftDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight shifts
    let durationMinutes;
    if (endMinutes < startMinutes) {
      // Add 24 hours (1440 minutes) to end time for overnight calculation
      durationMinutes = (endMinutes + 1440) - startMinutes;
    } else {
      durationMinutes = endMinutes - startMinutes;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading shifts...</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground">Manage work shifts and employee assignments</p>
          </div>
          <Button onClick={handleCreateShift}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </Button>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2">
            <span className="text-sm">Show inactive shifts</span>
            <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className={!shift.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {shift.name}
                    {!shift.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssignEmployees(shift)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditShift(shift)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteShift(shift)}
                      disabled={shift._count?.employees ? shift._count.employees > 0 : false}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{shift.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {calculateShiftDuration(shift.startTime, shift.endTime)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {shift._count?.employees || 0} employees assigned
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Break time: {shift.breakTime} minutes
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {shifts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shifts found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first work shift
              </p>
              <Button onClick={handleCreateShift}>
                <Plus className="w-4 h-4 mr-2" />
                Create Shift
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreateShiftDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onShiftCreated={handleShiftCreated}
        />

        {selectedShift && (
          <>
            <EditShiftDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              shift={selectedShift}
              onShiftUpdated={handleShiftUpdated}
            />

            <DeleteShiftDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              shift={selectedShift}
              onShiftDeleted={handleShiftDeleted}
            />

            <AssignEmployeesDialog
              open={assignDialogOpen}
              onOpenChange={setAssignDialogOpen}
              shift={selectedShift}
              onEmployeesAssigned={handleEmployeesAssigned}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}