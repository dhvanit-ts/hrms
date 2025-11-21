import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './routes/AuthGuard';
import { EmployeesPage } from './pages/Employees';
import { LeavesPage } from './pages/Leaves';
import DashboardLayout from './layouts/DashboardLayout';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        )
      },
      {
        path: '/leaves',
        element: (
          <AuthGuard>
            <LeavesPage />
          </AuthGuard>
        )
      },
      {
        path: '/employees',
        element: (
          <AuthGuard>
            <EmployeesPage />
          </AuthGuard>
        )
      },
      {
        path: '/employees/:id',
        element: (
          <AuthGuard>
            <div className="p-6">Employee details coming soon</div>
          </AuthGuard>
        )
      }
    ]
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    )
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);


