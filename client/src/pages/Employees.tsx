import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Mail,
  BadgeCheck,
  Building2
} from 'lucide-react';

// UI Components
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/shared/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { http } from '@/services/api/http';

const employeeSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
})

const EmployeeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      department: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
    setIsSubmitting(true);
    try {
      await http.post('/employees', values);
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Developer" {...field} />
                </FormControl>
                {form.formState.errors.role && <p className="text-sm font-medium text-red-500">{form.formState.errors.role.message}</p>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Engineering" {...field} />
                </FormControl>
                {form.formState.errors.department && <p className="text-sm font-medium text-red-500">{form.formState.errors.department.message}</p>}
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

// Mock Data
const mockEmployees = [
  { _id: '1', employeeId: 'EMP-001', name: 'Alice Johnson', email: 'alice@origin.com', status: 'Active', role: 'Frontend Developer', department: 'Engineering', avatar: 'https://i.pravatar.cc/150?u=alice' },
  { _id: '2', employeeId: 'EMP-002', name: 'Bob Smith', email: 'bob@origin.com', status: 'Active', role: 'Product Manager', department: 'Product', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { _id: '3', employeeId: 'EMP-003', name: 'Charlie Brown', email: 'charlie@origin.com', status: 'On Leave', role: 'UI Designer', department: 'Design', avatar: 'https://i.pravatar.cc/150?u=charlie' },
  { _id: '4', employeeId: 'EMP-004', name: 'Diana Prince', email: 'diana@origin.com', status: 'Inactive', role: 'Marketing Lead', department: 'Marketing', avatar: 'https://i.pravatar.cc/150?u=diana' },
];

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

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get('/employees', { headers: { Authorization: `Bearer ${accessToken}` } });
        if (res.data.employees) {
          setRows(res.data.employees);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load employees", error);
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  // Simple client-side filter for the demo
  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Employees</h2>
          <p className="text-sm text-zinc-500">Manage your team members and permissions.</p>
        </div>
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
            <EmployeeForm onSuccess={() => { }} />
          </SheetContent>
        </Sheet>
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
                  <th className="h-10 px-6 py-3 font-medium">Status</th>
                  <th className="h-10 px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Loading directory...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No employees found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r._id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.avatar || `https://ui-avatars.com/api/?name=${r.name}&background=random`}
                            alt={r.name}
                            className="h-9 w-9 rounded-full bg-zinc-200 object-cover border border-zinc-100"
                          />
                          <div>
                            <Link
                              to={`/employees/${r._id}`}
                              className="font-medium text-zinc-900 hover:underline hover:text-indigo-600 transition-colors"
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
                            {r.role || 'Employee'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Building2 className="h-3 w-3" />
                            {r.department || 'General'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </Button>
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