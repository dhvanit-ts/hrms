import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    employeeLogin as apiEmployeeLogin,
    employeeLogout as apiEmployeeLogout,
    employeeMe,
    employeeRefresh as apiEmployeeRefresh,
    employeeSetupPassword as apiEmployeeSetupPassword,
} from '@/services/api/employee-auth';
import { setEmployeeAuthCallbacks } from '../../services/api/employee-http';

type Employee = {
    id: number;
    employeeId: string;
    name: string;
    email: string;
    departmentId: number | null;
    jobRoleId: number | null;
};

type EmployeeAuthContextValue = {
    employee: Employee | null;
    accessToken: string | null;
    login: (identifier: string, password: string) => Promise<void>;
    setupPassword: (employeeId: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const EmployeeAuthContext = createContext<EmployeeAuthContextValue | undefined>(undefined);

export const EmployeeAuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const navigate = useNavigate();

    // Set up callbacks for HTTP interceptor
    useEffect(() => {
        const handleRefreshSuccess = (newAccessToken: string) => {
            setAccessToken(newAccessToken);
        };

        const handleRefreshFailure = () => {
            setEmployee(null);
            setAccessToken(null);
            navigate('/employee/login');
        };

        setEmployeeAuthCallbacks(handleRefreshSuccess, handleRefreshFailure);
    }, [navigate]);

    // Best-effort restore using cookie-based refresh on mount
    useEffect(() => {
        (async () => {
            try {
                const refreshResult = await apiEmployeeRefresh();
                setAccessToken(refreshResult.accessToken);
                const profile = await employeeMe(refreshResult.accessToken);
                setEmployee(profile.employee);
            } catch {
                // Silently fail - user will need to log in manually
            }
        })();
    }, []);

    const doLogin = async (identifier: string, password: string) => {
        const res = await apiEmployeeLogin(identifier, password);
        setAccessToken(res.accessToken);
        const profile = await employeeMe(res.accessToken);
        setEmployee(profile.employee);
    };

    const doSetupPassword = async (employeeId: string, password: string) => {
        const res = await apiEmployeeSetupPassword(employeeId, password);
        setAccessToken(res.accessToken);
        const profile = await employeeMe(res.accessToken);
        setEmployee(profile.employee);
    };

    const doLogout = async () => {
        try {
            await apiEmployeeLogout();
        } catch (error) {
            console.error('Logout API call failed, but clearing local state:', error);
        } finally {
            setEmployee(null);
            setAccessToken(null);
        }
    };

    const value = useMemo<EmployeeAuthContextValue>(
        () => ({
            employee,
            accessToken,
            login: doLogin,
            setupPassword: doSetupPassword,
            logout: doLogout,
        }),
        [employee, accessToken]
    );

    return <EmployeeAuthContext.Provider value={value}>{children || <Outlet />}</EmployeeAuthContext.Provider>;
};

export function useEmployeeAuth() {
    const ctx = useContext(EmployeeAuthContext);
    if (!ctx) throw new Error('useEmployeeAuth must be used within EmployeeAuthProvider');
    return ctx;
}
