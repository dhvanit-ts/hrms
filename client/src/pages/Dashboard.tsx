import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button className="px-3 py-2 border rounded" onClick={() => logout()}>
          Logout
        </button>
      </div>
      <div className="mt-6">
        <div className="text-sm text-gray-600">Signed in as</div>
        <div className="font-medium">{user?.email}</div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {(user?.roles || []).map((r) => (
            <span key={r} className="px-2 py-1 text-xs rounded bg-gray-200">
              {r}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <Link className="px-3 py-2 border rounded" to="/employees">Employees</Link>
        <Link className="px-3 py-2 border rounded" to="/leaves">My Leaves</Link>
      </div>
    </div>
  );
};


