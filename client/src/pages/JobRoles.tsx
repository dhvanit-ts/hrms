import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Briefcase,
  Search,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';

import { Switch } from '@/shared/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/shared/components/ui/dialog';
import { useAuth } from '@/shared/context/AuthContext';
import * as jobRolesApi from '@/services/api/job-roles';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';

interface JobRoleFormData {
  title: string;
  level: number;
  isActive: boolean;
}

export const JobRolesPage: React.FC = () => {
  const { accessToken, isAdmin, user } = useAuth();
  const [jobRoles, setJobRoles] = useState<jobRolesApi.JobRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState<jobRolesApi.JobRole | null>(null);
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: '',
    level: 1,
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = isAdmin && user?.roles?.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(role)
  );

  // Load job roles
  const loadJobRoles = async () => {
    if (!accessToken || !hasAdminAccess) return;

    setIsLoading(true);
    try {
      const result = await jobRolesApi.getJobRoles(accessToken, showInactive);
      setJobRoles(result.jobRoles);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobRoles();
  }, [accessToken, hasAdminAccess, showInactive]);

  // Filter job roles based on search
  const filteredJobRoles = (jobRoles || []).filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create job role
  const handleCreate = async () => {
    if (!accessToken || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await jobRolesApi.createJobRole(accessToken, {
        title: formData.title.trim(),
        level: formData.level,
        isActive: formData.isActive
      });

      setSuccessMessage('Job role created successfully');
      setIsCreateDialogOpen(false);
      setFormData({ title: '', level: 1, isActive: true });
      await loadJobRoles();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update job role
  const handleUpdate = async () => {
    if (!accessToken || !editingJobRole || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await jobRolesApi.updateJobRole(accessToken, editingJobRole.id, {
        title: formData.title.trim(),
        // description: formData.description.trim() || undefined,
        level: formData.level,
        isActive: formData.isActive
      });

      setSuccessMessage('Job role updated successfully');
      setEditingJobRole(null);
      setFormData({ title: '', level: 1, isActive: true });
      await loadJobRoles();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete job role
  const handleDelete = async (jobRole: jobRolesApi.JobRole) => {
    if (!accessToken) return;

    if (!window.confirm(`Are you sure you want to delete "${jobRole.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await jobRolesApi.deleteJobRole(accessToken, jobRole.id);
      setSuccessMessage('Job role deleted successfully');
      await loadJobRoles();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  // Open edit dialog
  const openEditDialog = (jobRole: jobRolesApi.JobRole) => {
    setEditingJobRole(jobRole);
    setFormData({
      title: jobRole.title,
      // description: jobRole.description || '',
      level: jobRole.level,
      isActive: jobRole.isActive
    });
  };

  // Close dialogs
  const closeDialogs = () => {
    setIsCreateDialogOpen(false);
    setEditingJobRole(null);
    setFormData({ title: '', level: 1, isActive: true });
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">You don't have permission to manage job roles.</p>
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
          <h2 className="text-xl font-semibold text-zinc-900">Job Role Management</h2>
          <p className="text-sm text-zinc-500">Manage job roles and their details</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Job Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Job Role</DialogTitle>
              <DialogDescription>Add a new job role to your organization</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Software Engineer, Marketing Manager"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  placeholder="Job level (1-10)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active Role
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.title.trim()}>
                  {isSubmitting ? 'Creating...' : 'Create Job Role'}
                </Button>
                <Button variant="outline" onClick={closeDialogs}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search job roles..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showInactive"
                checked={showInactive}
                onCheckedChange={(checked: boolean) => setShowInactive(checked)}
              />
              <label htmlFor="showInactive" className="text-sm font-medium">
                Show Inactive Roles
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobRoles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-zinc-500">
            {searchTerm ? 'No job roles found matching your search.' : 'No job roles found.'}
          </div>
        ) : (
          filteredJobRoles.map((jobRole) => (
            <Card key={jobRole.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{jobRole.title}</CardTitle>
                      <p className="text-sm text-zinc-500">Level {jobRole.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {jobRole.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-zinc-400" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(jobRole)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(jobRole)}
                      disabled={jobRole._count.employees > 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {jobRole.description && (
                  <CardDescription>{jobRole.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-600">
                      {jobRole._count.employees} employee{jobRole._count.employees !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={jobRole.isActive ? "default" : "secondary"}>
                      {jobRole.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {jobRole._count.employees > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Cannot Delete
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingJobRole} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Role</DialogTitle>
            <DialogDescription>Update job role information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Software Engineer, Marketing Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                placeholder="Job level (1-10)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
              />
              <label htmlFor="editIsActive" className="text-sm font-medium">
                Active Role
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? 'Updating...' : 'Update Job Role'}
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

export default JobRolesPage;