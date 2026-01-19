import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Mail,
  BadgeCheck,
  Building2,
  Edit3,
  RotateCcw
} from 'lucide-react';
import { } from "node:sqlite"

// UI Components
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/shared/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { Spinner } from '@/shared/components/ui/spinner';
import { RefreshButton } from '@/shared/components/ui/refresh-button';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/shared/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { http } from '@/services/api/http';
import * as departmentsApi from '@/services/api/departments';
import * as jobRolesApi from '@/services/api/job-roles';
import type { CreateEmployeeDTO } from '@/types/employee.dto';

const employeeSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  departmentId: z.number().min(1, "Department is required"),
  jobRoleId: z.number().min(1, "Job role is required"),
  hireDate: z.string().optional(),
  salary: z.number().min(0, "Salary must be positive").optional(),
})

const EmployeeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<departmentsApi.Department[]>([]);
  const [jobRoles, setJobRoles] = useState<jobRolesApi.JobRole[]>([]);
  const { accessToken } = useAuth();

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      departmentId: undefined,
      jobRoleId: undefined,
      hireDate: "",
      salary: undefined,
    },
  });

  // Load departments and job roles
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;

      try {
        const [deptResult, roleResult] = await Promise.all([
          departmentsApi.getDepartments(accessToken),
          jobRolesApi.getJobRoles(accessToken, false) // only active roles
        ]);
        setDepartments(deptResult.departments);
        setJobRoles(roleResult.jobRoles);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };

    loadData();
  }, [accessToken]);

  const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
    setIsSubmitting(true);
    try {
      const createData: Omit<CreateEmployeeDTO, "employeeId"> = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        departmentId: values.departmentId,
        jobRoleId: values.jobRoleId,
        hireDate: values.hireDate || null,
        salary: values.salary || null,
      };

      await http.post('/employees', createData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 px-4">
        <div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Jane Doe" {...field} />
                </FormControl>
                {form.formState.errors.name && <p className="text-sm font-medium text-red-500">{form.formState.errors.name.message}</p>}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="jane@company.com" {...field} />
                </FormControl>
                {form.formState.errors.email && <p className="text-sm font-medium text-red-500">{form.formState.errors.email.message}</p>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. +1 234 567 8900" {...field} />
                </FormControl>
                {form.formState.errors.phone && <p className="text-sm font-medium text-red-500">{form.formState.errors.phone.message}</p>}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.departmentId && <p className="text-sm font-medium text-red-500">{form.formState.errors.departmentId.message}</p>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobRoleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Role</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.title} (Level {role.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.jobRoleId && <p className="text-sm font-medium text-red-500">{form.formState.errors.jobRoleId.message}</p>}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hire Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                {form.formState.errors.hireDate && <p className="text-sm font-medium text-red-500">{form.formState.errors.hireDate.message}</p>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                {form.formState.errors.salary && <p className="text-sm font-medium text-red-500">{form.formState.errors.salary.message}</p>}
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            Create Employee
          </Button>
        </div>
      </form>
    </Form>
  );
};

/* ----------------------------------------------------------------------------------
 * MOCKS (To replace missing external dependencies in this preview)
 * ---------------------------------------------------------------------------------- */

// Mock useAuth hook
const useAuth = () => {
  const [user] = useState({ id: 'emp-123', name: 'John Doe', email: 'john@company.com' });
  const accessToken = 'mock-token-xyz';
  return { user, accessToken };
};

/* ----------------------------------------------------------------------------------
 * MAIN COMPONENT
 * ---------------------------------------------------------------------------------- */

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent shadow-none">Active</Badge>;
    case 'on leave':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent shadow-none">On Leave</Badge>;
    default:
      return <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-zinc-200 shadow-none">Inactive</Badge>;
  }
};

export const EmployeesPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Shift assignment dialog state
  const [assignShiftDialogOpen, setAssignShiftDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await http.get('/employees', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.data.employees) {
        setRows(res.data.employees);
      }
    } catch (error) {
      console.error("Failed to load employees", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [accessToken]);

  // Simple client-side filter for the demo
  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignShift = (employee: any) => {
    setSelectedEmployee(employee);
    setAssignShiftDialogOpen(true);
  };

  const handleShiftAssigned = () => {
    // Refresh the employee list to show updated shift assignments
    loadEmployees();
    setAssignShiftDialogOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Employees</h2>
          <p className="text-sm text-zinc-500">Manage your team members and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={loadEmployees}
            isLoading={isLoading}
            showText={true}
            variant="outline"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add Employee</SheetTitle>
                <SheetDescription>
                  Add a new employee to your organization.
                </SheetDescription>
              </SheetHeader>
              <EmployeeForm onSuccess={() => {
                // Refresh the employee list
                loadEmployees();
              }} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filters & Actions */}
      <Card>
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 bg-zinc-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-3.5 w-3.5 text-zinc-500" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              Export
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/50 text-zinc-500">
                <tr>
                  <th className="h-10 px-6 py-3 font-medium">Employee</th>
                  <th className="h-10 px-6 py-3 font-medium">Contact</th>
                  <th className="h-10 px-6 py-3 font-medium">Role & Dept</th>
                  <th className="h-10 px-6 py-3 font-medium">Shift</th>
                  <th className="h-10 px-6 py-3 font-medium">Status</th>
                  <th className="h-10 px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      Loading directory...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      No employees found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.avatar || `https://ui-avatars.com/api/?name=${r.name}&background=random`}
                            alt={r.name}
                            className="h-9 w-9 rounded-full bg-zinc-200 object-cover border border-zinc-100"
                          />
                          <div>
                            <Link
                              to={`/dashboard/employees/${r.id}`}
                              className="font-medium text-zinc-900 hover:underline hover:text-indigo-600 transition-colors cursor-pointer"
                              title="View employee profile"
                            >
                              {r.name}
                            </Link>
                            <div className="text-xs text-zinc-500">{r.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          {r.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-900">
                            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                            {r.jobRole?.title || r.role || 'Employee'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Building2 className="h-3 w-3" />
                            {r.department?.name || r.department || 'General'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.shift ? (
                          <div className="flex items-center gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-sm text-zinc-900">{r.shift.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">No shift assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/dashboard/employees/${r.id}`}>
                            <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Edit Profile
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;