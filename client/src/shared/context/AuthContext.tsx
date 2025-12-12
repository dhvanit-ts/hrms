import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, me, register as apiRegister, refresh as apiRefresh } from '@/services/api/auth';
import { setAuthCallbacks, setAccessTokenGetter } from '@/services/api/http';
import {
  employeeLogin as apiEmployeeLogin,
  employeeLogout as apiEmployeeLogout,
  employeeMe,
  employeeRefresh as apiEmployeeRefresh,
  employeeSetupPassword as apiEmployeeSetupPassword,
} from '@/services/api/employee-auth';
import { setEmployeeAuthCallbacks, setEmployeeAccessTokenGetter } from '@/services/api/employee-http';

type AdminUser = { email: string; roles: string[]; id?: string };
type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  departmentId: number | null;
  jobRoleId: number | null;
};

type AuthContextValue = {
  // Admin auth
  user: AdminUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Employee auth
  employee: Employee | null;
  employeeAccessToken: string | null;
  employeeLogin: (identifier: string, password: string) => Promise<void>;
  employeeSetupPassword: (employeeId: string, password: string) => Promise<void>;
  employeeLogout: () => Promise<void>;

  // Utility
  isAdmin: boolean;
  isEmployee: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // Admin state
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Employee state
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeAccessToken, setEmployeeAccessToken] = useState<string | null>(null);

  // Track if session restoration has completed
  const [sessionRestored, setSessionRestored] = useState(false);

  const navigate = useNavigate();

  // Computed auth states
  const isAdmin = !!user;
  const isEmployee = !!employee;

  // Redirect authenticated users away from login pages (only after session restoration)
  useEffect(() => {
    if (!sessionRestored) return; // Wait for session restoration to complete

    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath === '/' || currentPath === '/login' || currentPath === '/admin/login';

    if (isOnLoginPage && (isEmployee || isAdmin)) {
      console.log('Redirecting authenticated user to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isEmployee, isAdmin, navigate, sessionRestored]);

  // Set up callbacks for HTTP interceptors (only once)
  useEffect(() => {
    // Admin auth callbacks
    const handleRefreshSuccess = (newAccessToken: string) => {
      setAccessToken(newAccessToken);
    };

    const handleRefreshFailure = () => {
      setUser(null);
      setAccessToken(null);
      navigate('/admin/login');
    };

    setAuthCallbacks(handleRefreshSuccess, handleRefreshFailure);

    // Employee auth callbacks
    const handleEmployeeRefreshSuccess = (newAccessToken: string) => {
      setEmployeeAccessToken(newAccessToken);
    };

    const handleEmployeeRefreshFailure = () => {
      setEmployee(null);
      setEmployeeAccessToken(null);
      navigate('/login');
    };

    setEmployeeAuthCallbacks(handleEmployeeRefreshSuccess, handleEmployeeRefreshFailure);
  }, [navigate]);

  // Update token getters whenever tokens change
  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    setEmployeeAccessTokenGetter(() => employeeAccessToken);
  }, [employeeAccessToken]);

  // Security check: Ensure access token is never persisted to storage
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const localStorageKeys = Object.keys(localStorage);
      const sessionStorageKeys = Object.keys(sessionStorage);

      const suspiciousKeys = [...localStorageKeys, ...sessionStorageKeys].filter(
        key => key.toLowerCase().includes('token') || key.toLowerCase().includes('access')
      );

      if (suspiciousKeys.length > 0) {
        console.warn(
          'WARNING: Potential security issue detected! Found token-related keys in storage:',
          suspiciousKeys
        );
        console.warn('Access tokens should only be stored in memory, not in localStorage or sessionStorage');
      }
    }
  }, []);

  // Best-effort restore sessions on mount
  useEffect(() => {
    const restoreSessions = async () => {
      console.log('Attempting session restoration...');

      try {
        // Try employee session first (since it's more common)
        try {
          console.log('Attempting to restore employee session...');
          const refreshResult = await apiEmployeeRefresh();
          console.log('Employee refresh successful, got access token');
          setEmployeeAccessToken(refreshResult.accessToken);
          const profile = await employeeMe(refreshResult.accessToken);
          setEmployee(profile.employee);
          console.log('Employee session restored successfully:', profile.employee.name);
          return; // If employee session restored, don't try admin
        } catch (error: any) {
          console.log('Employee refresh failed:', error?.response?.data?.code || error.message);
          // Only try admin if employee refresh failed due to missing token
          if (error?.response?.data?.code === 'MISSING_REFRESH_TOKEN') {
            console.log('No employee token, trying admin...');
          }
        }

        // Try admin session if employee failed
        try {
          console.log('Attempting to restore admin session...');
          const refreshResult = await apiRefresh();
          console.log('Admin refresh successful, got access token');
          setAccessToken(refreshResult.accessToken);
          const profile = await me(refreshResult.accessToken);
          setUser(profile.user);
          console.log('Admin session restored successfully:', profile.user.email);
        } catch (error: any) {
          console.log('Admin refresh failed:', error?.response?.data || error.message);
          console.log('Admin refresh error details:', error?.response);
        }
      } finally {
        // Mark session restoration as complete regardless of success/failure
        setSessionRestored(true);
        console.log('Session restoration completed');
      }
    };

    restoreSessions();
  }, []);

  // Admin auth methods
  const doLogin = async (email: string, password: string) => {
    // Clear employee state when admin logs in
    setEmployee(null);
    setEmployeeAccessToken(null);

    console.log('Admin login attempt...');
    const res = await apiLogin(email, password);
    console.log('Admin login successful, setting state');
    setAccessToken(res.accessToken);
    const profile = await me(res.accessToken);
    setUser(profile.user);
    console.log('Admin user set:', profile.user);
  };

  const doLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout API call failed, but clearing local state:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const doRegister = async (email: string, password: string) => {
    // Clear employee state when admin registers
    setEmployee(null);
    setEmployeeAccessToken(null);

    const res = await apiRegister({ email, password });
    setAccessToken(res.accessToken);
    const profile = await me(res.accessToken);
    setUser(profile.user);
  };

  // Employee auth methods
  const doEmployeeLogin = async (identifier: string, password: string) => {
    // Clear admin state when employee logs in
    setUser(null);
    setAccessToken(null);

    const res = await apiEmployeeLogin(identifier, password);
    setEmployeeAccessToken(res.accessToken);
    const profile = await employeeMe(res.accessToken);
    setEmployee(profile.employee);
  };

  const doEmployeeSetupPassword = async (employeeId: string, password: string) => {
    // Clear admin state when employee sets up password
    setUser(null);
    setAccessToken(null);

    const res = await apiEmployeeSetupPassword(employeeId, password);
    setEmployeeAccessToken(res.accessToken);
    const profile = await employeeMe(res.accessToken);
    setEmployee(profile.employee);
  };

  const doEmployeeLogout = async () => {
    try {
      await apiEmployeeLogout();
    } catch (error) {
      console.error('Employee logout API call failed, but clearing local state:', error);
    } finally {
      setEmployee(null);
      setEmployeeAccessToken(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      login: doLogin,
      register: doRegister,
      logout: doLogout,
      employee,
      employeeAccessToken,
      employeeLogin: doEmployeeLogin,
      employeeSetupPassword: doEmployeeSetupPassword,
      employeeLogout: doEmployeeLogout,
      isAdmin,
      isEmployee,
    }),
    [user, accessToken, employee, employeeAccessToken, isAdmin, isEmployee]
  );

  return <AuthContext.Provider value={value}>{children || <Outlet />}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
