"use client"

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, User as UserIcon, Briefcase } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from '@/shared/context/AuthContext';
import { AttendanceDashboard } from '@/shared/components/AttendanceDashboard';
import { LeaveManagement } from '@/shared/components/LeaveManagement';
import { SSETestPanel } from '@/components/SSETestPanel';
import { statsApi, type DashboardStats } from '@/services/api/stats';

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
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/shared/components/ui/form';
import { useForm } from 'react-hook-form';
import { http } from '@/services/api/http';
import { Spinner } from '@/shared/components/ui/spinner';
import { RefreshButton } from '@/shared/components/ui/refresh-button';
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Check if user has admin/HR/manager roles
  const hasAdminAccess = isAdmin && user?.roles.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(role)
  );

  // Fetch dashboard stats for admin users
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const dashboardStats = await statsApi.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (hasAdminAccess) {
      fetchStats();
    }
  }, [hasAdminAccess]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
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
        {hasAdminAccess && (
          <RefreshButton
            onRefresh={fetchStats}
            isLoading={isLoadingStats}
            showText={true}
            variant="outline"
          />
        )}
      </div>

      {/* Admin/HR/Manager Stats - Only show for admin users */}
      {hasAdminAccess && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoadingStats ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            [
              {
                label: 'Total Employees',
                value: stats.totalEmployees?.toString() || "N/A",
                change: 'Active',
                redirect: "/dashboard/employees",
                icon: Users
              },
              {
                label: 'On Leave',
                value: stats.onLeave?.toString() || "N/A",
                change: 'Today',
                redirect: "/dashboard/leaves",
                icon: Calendar
              },
              {
                label: 'New Hires',
                value: stats.newHires?.toString() || "N/A",
                change: 'This month',
                redirect: "/dashboard/employees",
                icon: UserIcon
              },
              {
                label: 'Job Roles',
                value: stats.openRoles?.toString() || "N/A",
                change: 'Available',
                redirect: "/dashboard/job-roles",
                icon: Briefcase
              },
            ].map((stat, i) => (
              <Link to={stat.redirect}>
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
              </Link>
            ))
          ) : (
            // Error state - show placeholder with dashes
            [
              { label: 'Total Employees', icon: Users },
              { label: 'On Leave', icon: Calendar },
              { label: 'New Hires', icon: UserIcon },
              { label: 'Open Roles', icon: Briefcase },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                    <stat.icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-bold text-zinc-900">--</h3>
                    <span className="text-xs font-medium text-gray-400">Unavailable</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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

            {/* SSE Test Panel - Only in development */}
            {process.env.NODE_ENV !== "production" && (
              <SSETestPanel />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { DashboardPage };