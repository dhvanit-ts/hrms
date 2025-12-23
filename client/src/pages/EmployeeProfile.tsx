import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  CreditCard,
  FileText,
  Clock,
  Award,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
import { useAuth } from '@/shared/context/AuthContext';
import { employeeMe, changePassword, adminChangeEmployeePassword } from '@/services/api/employee-auth';
import { http } from '@/services/api/http';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';
import * as attendanceApi from '@/services/api/attendance';
import * as leavesApi from '@/services/api/leaves';
import * as departmentsApi from '@/services/api/departments';
import * as jobRolesApi from '@/services/api/job-roles';
import { shiftsApi, type Shift } from '@/services/api/shifts';
import {
  type EmployeeProfile,
  type EmployeeFormData,
  EmployeeTransformer,
  EmployeeDTOValidator
} from '@/types/employee.dto';

// Using EmployeeProfile from DTO instead of local interface

interface ProfileStats {
  totalWorkingDays: number;
  presentDays: number;
  leavesUsed: number;
  leavesRemaining: number;
}

export const EmployeeProfilePage: React.FC = () => {
  const { employeeAccessToken, accessToken, isEmployee, isAdmin, user } = useAuth();
  const { id: employeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EmployeeFormData>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showAdminPasswordForm, setShowAdminPasswordForm] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<"active" | "inactive" | "terminated" | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [departments, setDepartments] = useState<departmentsApi.Department[]>([]);
  const [jobRoles, setJobRoles] = useState<jobRolesApi.JobRole[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const isAdminMode = employeeId && isAdmin;
  const isViewingOwnProfile = !employeeId && isEmployee;

  const hasAdminAccess = isAdmin && user?.roles?.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(role)
  );

  const loadDropdownData = async () => {
    if (isAdminMode && accessToken) {
      try {
        const [deptRes, rolesRes, shiftsRes] = await Promise.all([
          departmentsApi.getDepartments(accessToken),
          jobRolesApi.getJobRoles(accessToken),
          shiftsApi.getAll(false) // Only active shifts
        ]);
        setDepartments(deptRes.departments);
        setJobRoles(rolesRes.jobRoles);
        setShifts(shiftsRes.shifts);
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
      }
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      let profileRes;

      if (isAdminMode && accessToken) {
        const [empRes] = await Promise.all([
          http.get(`/employees/${employeeId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          loadDropdownData()
        ]);
        profileRes = empRes;
        setEmployee(profileRes.data.employee);
        setEditForm(EmployeeTransformer.toFormData(profileRes.data.employee));

        // For admin mode, we might not load attendance stats for now
        // This could be extended later if needed

      } else if (isViewingOwnProfile && employeeAccessToken) {
        const empProfileRes = await employeeMe(employeeAccessToken);
        setEmployee(empProfileRes.employee);
        setEditForm(EmployeeTransformer.toFormData(empProfileRes.employee));

        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const hireDate = empProfileRes.employee.hireDate ? new Date(empProfileRes.employee.hireDate) : null;

        const effectiveStartDate = hireDate && hireDate > yearStart ? hireDate : yearStart;

        const [attendanceRes, leaveBalanceRes] = await Promise.all([
          attendanceApi.getAttendanceHistory(employeeAccessToken, {
            startDate: effectiveStartDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          }),
          leavesApi.getLeaveBalance(employeeAccessToken)
        ]);

        const presentDays = attendanceRes.attendances.filter(a => a.checkIn).length;
        const totalWorkingDays = Math.floor((new Date().getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24));

        setProfileStats({
          totalWorkingDays,
          presentDays,
          leavesUsed: leaveBalanceRes.balance.usedDays,
          leavesRemaining: leaveBalanceRes.balance.remaining
        });
      }

    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [employeeAccessToken, accessToken, isEmployee, isAdmin, employeeId]);

  const handleSaveProfile = async () => {
    try {
      if (isAdminMode && accessToken) {
        const updateData: any = {};

        if (editForm.name) updateData.name = editForm.name;
        if (editForm.email) updateData.email = editForm.email;
        if (editForm.phone !== undefined) updateData.phone = editForm.phone || null;
        if (editForm.status) updateData.status = editForm.status;
        if (editForm.salary !== undefined) updateData.salary = editForm.salary || 0;
        if (editForm.leaveAllowance !== undefined) updateData.leaveAllowance = editForm.leaveAllowance || null;
        if (editForm.dateOfBirth !== undefined) updateData.dateOfBirth = editForm.dateOfBirth || null;
        if (editForm.departmentId !== undefined) updateData.departmentId = editForm.departmentId || null;
        if (editForm.jobRoleId !== undefined) updateData.jobRoleId = editForm.jobRoleId || null;
        if (editForm.shiftId !== undefined) updateData.shiftId = editForm.shiftId || null;
        if (editForm.hireDate !== undefined) updateData.hireDate = editForm.hireDate || null

        await http.patch(`/employees/${employeeId}`, updateData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else if (isViewingOwnProfile && employeeAccessToken) {
        // Employee updating their own profile (limited fields)
        const allowedFields = {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          dateOfBirth: editForm.dateOfBirth || null
        };
        // Here you would call an update profile API for employees
        // For now, we'll just show success message
      }

      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadProfile(); // Reload the profile
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const handleConfirmTermination = () => {
    if (pendingStatusChange) {
      setEditForm({ ...editForm, status: pendingStatusChange });
      setShowTerminationDialog(false);
      setPendingStatusChange(null);
    }
  };

  const handleCancelTermination = () => {
    setShowTerminationDialog(false);
    setPendingStatusChange(null);
    if (employee) {
      setEditForm({ ...editForm, status: employee.status });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setErrorMessage('Please fill in all password fields');
      return;
    }

    if (!employeeAccessToken) {
      setErrorMessage('Authentication required');
      return;
    }

    try {
      await changePassword(
        employeeAccessToken,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setSuccessMessage('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const handleAdminChangePassword = async () => {
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (!adminPasswordForm.newPassword) {
      setErrorMessage('Please enter a new password');
      return;
    }

    if (!accessToken || !employee) {
      setErrorMessage('Authentication required');
      return;
    }

    try {
      await adminChangeEmployeePassword(
        accessToken,
        employee.id,
        adminPasswordForm.newPassword
      );

      setSuccessMessage('Employee password changed successfully');
      setShowAdminPasswordForm(false);
      setAdminPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'terminated':
        return <Badge variant="destructive" className='text-zinc-200 font-bold'>Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isViewingOwnProfile && !isAdminMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Access denied. You can only view your own profile or you need admin access.</p>
      </div>
    );
  }

  if (isAdminMode && !hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">You don't have permission to edit employee profiles.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Employee profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
          autoDismiss={true}
          dismissAfter={5000}
        />
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {isAdminMode && (
            <Button className='aspect-square size-12 rounded-full' variant="outline" size="sm" onClick={() => navigate('/dashboard/employees')}>
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              {isAdminMode ? `Employee Profile - ${employee?.name || 'Loading...'}` : 'My Profile'}
            </h2>
            <p className="text-sm text-zinc-500">
              {isAdminMode
                ? 'Manage employee information and settings'
                : 'Manage your personal information and account settings'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-zinc-900">{employee.name}</h3>
              <p className="text-zinc-600">{employee.jobRole?.title || 'Employee'}</p>
              <p className="text-sm text-zinc-500">{employee.department?.name || 'No Department'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">ID: {employee.employeeId}</Badge>
                {getStatusBadge(employee.status)}
              </div>
            </div>
            {profileStats && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{profileStats.presentDays}</div>
                  <div className="text-xs text-zinc-500">Days Present</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{profileStats.leavesRemaining}</div>
                  <div className="text-xs text-zinc-500">Leaves Left</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="work">Work Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic personal details</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setEditForm(employee);
                    }
                    setIsEditing(!isEditing);
                  }}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{employee.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{employee.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{employee.phone || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{EmployeeTransformer.formatDate(employee.dateOfBirth)}</p>
                  )}
                </div>

                {/* Admin-only fields */}
                {isAdminMode && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Salary
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.salary || ''}
                          onChange={(e) => setEditForm({ ...editForm, salary: Number(e.target.value) })}
                          placeholder="Enter salary amount"
                        />
                      ) : (
                        <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">
                          {employee.salary ? `$${employee.salary.toLocaleString()}` : 'Not set'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Leave Allowance (Days)
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.leaveAllowance || ''}
                          onChange={(e) => setEditForm({ ...editForm, leaveAllowance: Number(e.target.value) })}
                          placeholder="Enter leave allowance"
                        />
                      ) : (
                        <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">
                          {employee.leaveAllowance || 20} days per year
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Details Tab */}
        <TabsContent value="work">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Information</CardTitle>
                  <CardDescription>Employment and work-related details</CardDescription>
                </div>
                {isAdminMode && (
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setEditForm(employee);
                      }
                      setIsEditing(!isEditing);
                    }}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title
                  </label>
                  {isAdminMode && isEditing ? (
                    <select
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.jobRoleId || ''}
                      onChange={(e) => setEditForm({ ...editForm, jobRoleId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select Job Role</option>
                      {jobRoles?.map(role => (
                        <option key={role.id} value={role.id}>{role.title}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{employee.jobRole?.title || 'Not assigned'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Department
                  </label>
                  {isAdminMode && isEditing ? (
                    <select
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.departmentId || ''}
                      onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select Department</option>
                      {departments?.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{employee.department?.name || 'Not assigned'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Hire Date
                  </label>
                  {isAdminMode && isEditing ? (
                    <Input
                      type="date"
                      value={editForm.hireDate ? EmployeeTransformer.toDateInputFormat(editForm.hireDate) : ''}
                      onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value || null })}
                    />
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">{EmployeeTransformer.formatDate(employee.hireDate)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Employment Status
                  </label>
                  {isAdminMode && isEditing ? (
                    <select
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.status || ''}
                      onChange={(e) => {
                        const newStatus = e.target.value as "active" | "inactive" | "terminated";
                        if (newStatus === "terminated" && employee?.status !== "terminated") {
                          // Show confirmation dialog for termination
                          setPendingStatusChange(newStatus);
                          setShowTerminationDialog(true);
                        } else {
                          // Direct status change for other statuses
                          setEditForm({ ...editForm, status: newStatus });
                        }
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  ) : (
                    <div className="bg-zinc-50 p-3 rounded-md">
                      {getStatusBadge(employee.status)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Work Shift
                  </label>
                  {isAdminMode && isEditing ? (
                    <select
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.shiftId || ''}
                      onChange={(e) => setEditForm({ ...editForm, shiftId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">No Shift Assigned</option>
                      {shifts?.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-zinc-900 bg-zinc-50 p-3 rounded-md">
                      {employee.shift ? `${employee.shift.name} (${employee.shift.startTime} - ${employee.shift.endTime})` : 'No shift assigned'}
                    </p>
                  )}
                </div>
              </div>

              {isAdminMode && isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          {employeeAccessToken && <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-zinc-500" />
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-zinc-500">Last changed 30 days ago</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Change Password
                </Button>
              </div>

              {showPasswordForm && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleChangePassword}>
                        Update Password
                      </Button>
                      <Button variant="outline" onClick={() => setShowPasswordForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>}

          {/* Admin Password Change Section */}
          {isAdminMode && hasAdminAccess && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Administrative password management for this employee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-zinc-500" />
                    <div>
                      <h4 className="font-medium">Reset Employee Password</h4>
                      <p className="text-sm text-zinc-500">Set a new password for this employee</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminPasswordForm(!showAdminPasswordForm)}
                  >
                    Reset Password
                  </Button>
                </div>

                {showAdminPasswordForm && (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input
                          type="password"
                          value={adminPasswordForm.newPassword}
                          onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                          placeholder="Enter new password for employee"
                        />
                        <p className="text-xs text-zinc-500">
                          Password must be at least 12 characters with uppercase, lowercase, number, and special character
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <Input
                          type="password"
                          value={adminPasswordForm.confirmPassword}
                          onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleAdminChangePassword} className="bg-orange-600 hover:bg-orange-700">
                          Reset Employee Password
                        </Button>
                        <Button variant="outline" onClick={() => setShowAdminPasswordForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid gap-6">
            {profileStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{profileStats.presentDays}</p>
                        <p className="text-sm text-zinc-500">Days Present</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{profileStats.leavesUsed}</p>
                        <p className="text-sm text-zinc-500">Leaves Used</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">{profileStats.leavesRemaining}</p>
                        <p className="text-sm text-zinc-500">Leaves Remaining</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">{Math.round((profileStats.presentDays / profileStats.totalWorkingDays) * 100)}%</p>
                        <p className="text-sm text-zinc-500">Attendance Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <CreditCard className="w-6 h-6" />
                    <span>Update Bank Details</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <FileText className="w-6 h-6" />
                    <span>View Pay Slips</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <Clock className="w-6 h-6" />
                    <span>Request Leave</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Termination Confirmation Dialog */}
      <AlertDialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Employee Termination</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this employee? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Set the employee status to "Terminated"</li>
                <li>Automatically set the termination date to today</li>
                <li>Restrict future attendance and leave operations</li>
                <li>This action can be reversed by changing the status back</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTermination}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTermination}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeProfilePage;