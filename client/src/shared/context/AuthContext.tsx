import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, me, register as apiRegister, refresh as apiRefresh } from '@/services/api/auth';
import { setAuthCallbacks, setAccessTokenGetter } from '@/services/api/http';
import {
  employeeLogin as apiEmployeeLogin,
  employeeLogout as apiEmployeeLogout,
  employeeMe,
  employeeSetupPassword as apiEmployeeSetupPassword,
} from '@/services/api/employee-auth';
import { setEmployeeAuthCallbacks, setEmployeeAccessTokenGetter } from '@/services/api/employee-http';
import { debug } from '@/config/logger';

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
      debug.log('Redirecting authenticated user to dashboard');
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
      debug.log('Attempting session restoration...');

      // Try admin session first, then employee as fallback
      // Use direct axios calls to bypass interceptors during session restoration
      try {
        debug.log('Attempting to restore admin session...');
        // Direct call to avoid HTTP interceptor interference
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!refreshResponse.ok) {
          throw new Error(`Admin refresh failed: ${refreshResponse.status}`);
        }

        const refreshResult = await refreshResponse.json();
        debug.log('Admin refresh successful, got access token');
        setAccessToken(refreshResult.accessToken);
        const profile = await me(refreshResult.accessToken);
        setUser(profile.user);
        debug.log('Admin session restored successfully:', profile.user.email);
        setSessionRestored(true);
        return; // Success - don't try employee
      } catch (error: any) {
        const errorCode = error?.response?.data?.code;
        const errorStatus = error?.response?.status;
        debug.log('Admin refresh failed - Status:', errorStatus, 'Code:', errorCode, 'Message:', error.message);
        debug.log('Full admin error:', error?.response?.data);

        // Try employee if admin failed due to missing token OR other auth errors
        // (could be wrong token type, expired, etc.)
        if (errorStatus === 401 || error.message.includes('401')) {
          try {
            debug.log('Admin failed with 401, attempting employee session...');
            // Direct call to avoid HTTP interceptor interference
            const employeeRefreshResponse = await fetch('/api/auth/employee/refresh', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });

            if (!employeeRefreshResponse.ok) {
              throw new Error(`Employee refresh failed: ${employeeRefreshResponse.status}`);
            }

            const refreshResult = await employeeRefreshResponse.json();
            debug.log('Employee refresh successful, got access token');
            setEmployeeAccessToken(refreshResult.accessToken);
            const profile = await employeeMe(refreshResult.accessToken);
            setEmployee(profile.employee);
            debug.log('Employee session restored successfully:', profile.employee.name);
            setSessionRestored(true);
            return; // Success
          } catch (employeeError: any) {
            const empErrorCode = employeeError?.response?.data?.code;
            const empErrorStatus = employeeError?.response?.status;
            debug.log('Employee refresh failed - Status:', empErrorStatus, 'Code:', empErrorCode, 'Message:', employeeError.message);
            debug.log('Full employee error:', employeeError?.response?.data);
          }
        } else {
          debug.log('Admin failed with non-401 error, not trying employee fallback');
        }
      }

      // Both failed or admin failed for other reasons
      debug.log('Session restoration failed - user needs to log in');
      setSessionRestored(true);
    };

    restoreSessions();
  }, []);

  // Admin auth methods
  const doLogin = async (email: string, password: string) => {
    // Clear employee state when admin logs in
    setEmployee(null);
    setEmployeeAccessToken(null);

    debug.log('Admin login attempt...');
    const res = await apiLogin(email, password);
    debug.log('Admin login successful, setting state');
    setAccessToken(res.accessToken);
    const profile = await me(res.accessToken);
    setUser(profile.user);
    debug.log('Admin user set:', profile.user);
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
