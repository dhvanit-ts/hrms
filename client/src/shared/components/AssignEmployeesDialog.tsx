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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, Search, Users } from "lucide-react";
import { shiftsApi, type Shift } from "@/services/api/shifts";
import { employeesApi, type Employee } from "@/services/api/employees";

interface AssignEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift;
  onEmployeesAssigned: () => void;
}

export function AssignEmployeesDialog({
  open,
  onOpenChange,
  shift,
  onEmployeesAssigned,
}: AssignEmployeesDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      setError(null);
      const response = await employeesApi.getAll();
      setEmployees(response.employees);
    } catch (err: any) {
      setError("Failed to fetch employees");
      console.error("Error fetching employees:", err);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchShiftEmployees = async () => {
    try {
      const response = await shiftsApi.getEmployees(shift.id);
      const assignedIds = response.employees.map((emp: { id: number; employeeId: string; name: string; email: string; }) => emp.id);
      setSelectedEmployeeIds(assignedIds);
    } catch (err: any) {
      console.error("Error fetching shift employees:", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchShiftEmployees();
    }
  }, [open, shift.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await shiftsApi.assignEmployees(shift.id, selectedEmployeeIds);
      onEmployeesAssigned();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign employees");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeToggle = (employeeId: number, checked: boolean) => {
    setSelectedEmployeeIds((prev) =>
      checked
        ? [...prev, employeeId]
        : prev.filter((id) => id !== employeeId)
    );
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Employees to {shift.name}
          </DialogTitle>
          <DialogDescription>
            Select employees to assign to this shift. Changes will be saved when you click "Save Changes".
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
            <Label htmlFor="search">Search Employees</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or employee ID..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            {fetchingEmployees ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No employees found matching your search." : "No employees available."}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted"
                  >
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={(checked) =>
                        handleEmployeeToggle(employee.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {employee.name}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {employee.employeeId}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.email}
                      </div>
                      {employee.department && (
                        <div className="text-xs text-muted-foreground">
                          {employee.department.name} • {employee.jobRole?.title || "No role"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedEmployeeIds.length} employee(s) selected
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
            <Button type="submit" disabled={loading || fetchingEmployees}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}