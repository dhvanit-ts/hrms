import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './routes/AuthGuard';
import { Employees } from './pages/Employees';
import { Leaves } from './pages/Leaves';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    )
  },
  {
    path: '/leaves',
    element: (
      <AuthGuard>
        <Leaves />
      </AuthGuard>
    )
  },
  {
    path: '/employees',
    element: (
      <AuthGuard>
        <Employees />
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
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);


