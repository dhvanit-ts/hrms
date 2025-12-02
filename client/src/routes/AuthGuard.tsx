import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';

interface AuthGuardProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin = false }) => {
  const { user, employee, isAdmin, isEmployee } = useAuth();

  // If admin access is required, check for admin user
  if (requireAdmin) {
    if (!isAdmin) return <Navigate to="/admin/login" replace />;
    return <>{children || <Outlet />}</>;
  }

  // Otherwise, allow either admin or employee
  if (!isAdmin && !isEmployee) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


