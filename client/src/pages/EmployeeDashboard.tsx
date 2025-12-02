import React from 'react';
import { useEmployeeAuth } from '@/shared/context/EmployeeAuthContext';
import { AttendanceDashboard } from '@/components/AttendanceDashboard';
import { LeaveManagement } from '@/components/LeaveManagement';

export const EmployeeDashboard: React.FC = () => {
    const { employee, logout } = useEmployeeAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-semibold">Employee Portal</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">Welcome, {employee?.name}!</h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600">Employee ID</p>
                            <p className="font-medium">{employee?.employeeId}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{employee?.email}</p>
                        </div>
                    </div>
                </div>

                <AttendanceDashboard />

                <div className="mt-6">
                    <LeaveManagement />
                </div>
            </main>
        </div>
    );
};
