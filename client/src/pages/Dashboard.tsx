"use client"

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, User as UserIcon, Briefcase } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from '@/shared/context/AuthContext';
import { AttendanceDashboard } from '@/components/AttendanceDashboard';
import { LeaveManagement } from '@/components/LeaveManagement';

// UI Components Imports
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { http } from '@/services/api/http';
import { Spinner } from '@/components/ui/spinner';
import z from 'zod';

const employeeSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
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

const DashboardPage: React.FC = () => {
  const { isAdmin, isEmployee, user, employee } = useAuth();

  // Check if user has admin/HR/manager roles
  const hasAdminAccess = isAdmin && user?.roles.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(role)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {isEmployee ? employee?.name : user?.email}!
        </h2>
        {isEmployee && (
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Employee ID:</span> {employee?.employeeId}</p>
            <p><span className="font-medium">Email:</span> {employee?.email}</p>
          </div>
        )}
        {isAdmin && (
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Roles:</span> {user?.roles.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Admin/HR/Manager Stats - Only show for admin users */}
      {hasAdminAccess && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Employees', value: '124', change: '+4%', icon: Users },
            { label: 'On Leave', value: '8', change: 'Active now', icon: Calendar },
            { label: 'New Hires', value: '12', change: 'This month', icon: UserIcon },
            { label: 'Open Roles', value: '3', change: 'Urgent', icon: Briefcase },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <stat.icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
                  <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Dashboard - Show attendance and leave management */}
      {isEmployee && (
        <div className="space-y-6">
          <AttendanceDashboard />
          <LeaveManagement />
        </div>
      )}

      {/* Admin Management Section */}
      {hasAdminAccess && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
                <CardDescription>Create employee records in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeForm onSuccess={() => { }} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/dashboard/employees"><Users className="mr-2 h-4 w-4" /> View Directory</Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/dashboard/leaves"><Calendar className="mr-2 h-4 w-4" /> Manage Leaves</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export { DashboardPage };