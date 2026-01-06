import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, UserX, UserCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { RefreshButton } from '@/shared/components/ui/refresh-button';
import { usersApi, User } from "@/services/api/users";
import { useAuth } from "@/shared/context/AuthContext";

const AVAILABLE_ROLES = ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"];

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    roles: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData: any = {
          roles: formData.roles,
          isActive: formData.isActive,
        };
        if (formData.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;

        await usersApi.update(editingUser.id, updateData);
      } else {
        await usersApi.create({
          email: formData.email,
          password: formData.password,
          roles: formData.roles,
        });
      }

      resetForm();
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await usersApi.delete(id);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      roles: user.roles,
      isActive: user.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      roles: [],
      isActive: true,
    });
    setShowForm(false);
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-700 hover:bg-red-200";
      case "ADMIN":
        return "bg-purple-100 text-purple-700 hover:bg-purple-200";
      case "HR":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "MANAGER":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      case "EMPLOYEE":
        return "bg-zinc-100 text-zinc-700 hover:bg-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-700 hover:bg-zinc-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">User Management</h2>
          <p className="text-sm text-zinc-500">
            Manage system users and their roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={fetchUsers}
            isLoading={loading}
            showText={true}
            variant="outline"
          />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Edit User" : "Create New User"}</CardTitle>
            <CardDescription>
              {editingUser
                ? "Update user details and permissions"
                : "Add a new user to the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                />
                <p className="text-xs text-zinc-500">
                  Min 12 chars, with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <Badge
                      key={role}
                      className={`cursor-pointer ${formData.roles.includes(role)
                        ? getRoleBadgeColor(role)
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                        }`}
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                {formData.roles.length === 0 && (
                  <p className="text-xs text-red-500">Select at least one role</p>
                )}
              </div>

              {editingUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-zinc-700">
                    Active
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={formData.roles.length === 0}>
                  {editingUser ? "Update User" : "Create User"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{user.email}</p>
                    {!user.isActive && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-transparent text-xs">
                        <UserX className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    {user.isActive && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-transparent text-xs">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        className={`${getRoleBadgeColor(role)} border-transparent text-xs`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Last login:{" "}
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>

                {currentUser?.id !== user.id.toString() && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(user)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">
                No users found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
