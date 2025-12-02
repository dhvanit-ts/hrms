import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '../shared/context/EmployeeAuthContext';

export const EmployeeAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { employee } = useEmployeeAuth();
    if (!employee) return <Navigate to="/employee/login" replace />;
    return <>{children}</>;
};
