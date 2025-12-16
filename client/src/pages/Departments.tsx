import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Building2,
  Search,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/shared/components/ui/dialog';
import { useAuth } from '@/shared/context/AuthContext';
import * as departmentsApi from '@/services/api/departments';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';

interface DepartmentFormData {
  name: string;
  description: string;
}

export const DepartmentsPage: React.FC = () => {
  const { accessToken, isAdmin, user } = useAuth();
  const [departments, setDepartments] = useState<departmentsApi.Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<departmentsApi.Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = isAdmin && user?.roles?.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(role)
  );

  // Load departments
  const loadDepartments = async () => {
    if (!accessToken || !hasAdminAccess) return;

    setIsLoading(true);
    try {
      const result = await departmentsApi.getDepartments(accessToken);
      setDepartments(result.departments);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [accessToken, hasAdminAccess]);

  // Filter departments based on search
  const filteredDepartments = (departments || []).filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle create department
  const handleCreate = async () => {
    if (!accessToken || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await departmentsApi.createDepartment(accessToken, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });

      setSuccessMessage('Department created successfully');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      await loadDepartments();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update department
  const handleUpdate = async () => {
    if (!accessToken || !editingDepartment || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await departmentsApi.updateDepartment(accessToken, editingDepartment.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });

      setSuccessMessage('Department updated successfully');
      setEditingDepartment(null);
      setFormData({ name: '', description: '' });
      await loadDepartments();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete department
  const handleDelete = async (department: departmentsApi.Department) => {
    if (!accessToken) return;

    if (!window.confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await departmentsApi.deleteDepartment(accessToken, department.id);
      setSuccessMessage('Department deleted successfully');
      await loadDepartments();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  // Open edit dialog
  const openEditDialog = (department: departmentsApi.Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ''
    });
  };

  // Close dialogs
  const closeDialogs = () => {
    setIsCreateDialogOpen(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">You don't have permission to manage departments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Success/Error Messages */}
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
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Department Management</h2>
          <p className="text-sm text-zinc-500">Manage organizational departments and their details</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>Add a new department to your organization</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engineering, Marketing, HR"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.name.trim()}>
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </Button>
                <Button variant="outline" onClick={closeDialogs}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search departments..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-zinc-500">
            {searchTerm ? 'No departments found matching your search.' : 'No departments found.'}
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(department)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(department)}
                      disabled={department._count.employees > 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {department.description && (
                  <CardDescription>{department.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-600">
                    {department._count.employees} employee{department._count.employees !== 1 ? 's' : ''}
                  </span>
                  {department._count.employees > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Cannot Delete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Department Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering, Marketing, HR"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? 'Updating...' : 'Update Department'}
              </Button>
              <Button variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;