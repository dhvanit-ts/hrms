import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Outlet } from 'react-router-dom';
import './index.css';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Register } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { AuthProvider } from './shared/context/AuthContext';
import { NotificationProvider } from './shared/context/NotificationContext';
import { AuthGuard } from './routes/AuthGuard';
import { EmployeesPage } from './pages/Employees';
import { LeavesPage } from './pages/Leaves';
import { AttendancePage } from './pages/Attendance';
import { EmployeeProfilePage } from './pages/EmployeeProfile';
import { HolidaysPage } from './pages/Holidays';
import { BankDetailsPage } from './pages/BankDetails';
import { UsersPage } from './pages/Users';
import { AuditReportsPage } from './pages/AuditReports';
import { SettingsPage } from './pages/Settings';
import DashboardLayout from './shared/layouts/DashboardLayout';
import DepartmentsPage from './pages/Departments';
import JobRolesPage from './pages/JobRoles';
import LeadsPage from './pages/Leads';
import { ShiftManagementPage } from './pages/ShiftManagement';
import { Tickets } from './pages/Tickets';
import { TicketsAdmin } from './pages/TicketsAdmin';
import { Toaster } from './shared/components/ui/toaster';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <NotificationProvider>
          <Outlet />
        </NotificationProvider>
      </AuthProvider>
    ),
    children: [
      // Employee routes (at root)
      { index: true, element: <Login /> },
      { path: "login", element: <Login /> },

      // Admin routes (under /admin)
      { path: "admin/login", element: <AdminLogin /> },
      { path: "admin/register", element: <Register /> },

      // Protected dashboard (unified for both admin and employee)
      {
        path: "dashboard",
        element: (
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "leaves", element: <LeavesPage /> },
          { path: "attendance", element: <AttendancePage /> },
          { path: "tickets", element: <Tickets /> },
          { path: "tickets-admin", element: <TicketsAdmin /> },
          { path: "profile", element: <EmployeeProfilePage /> },
          { path: "holidays", element: <HolidaysPage /> },
          { path: "bank-details", element: <BankDetailsPage /> },
          { path: "employees", element: <EmployeesPage /> },
          { path: "employees/:id", element: <EmployeeProfilePage /> },
          { path: "users", element: <UsersPage /> },
          { path: "reports", element: <AuditReportsPage /> },
          { path: "departments", element: <DepartmentsPage /> },
          { path: "job-roles", element: <JobRolesPage /> },
          { path: "shifts", element: <ShiftManagementPage /> },
          { path: "leads", element: <LeadsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ]
      },

      // Admin-specific routes (legacy support)
      {
        path: "admin",
        element: (
          <AuthGuard requireAdmin />
        ),
        children: [
          { path: "dashboard", element: <DashboardLayout />, children: [{ index: true, element: <DashboardPage /> }] },
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);
