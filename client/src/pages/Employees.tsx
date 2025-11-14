import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { http } from '../services/api/http';
import { Link } from 'react-router-dom';

export const Employees: React.FC = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const res = await http.get('/employees', { headers: { Authorization: `Bearer ${accessToken}` } });
      setRows(res.data.employees);
    })();
  }, [accessToken]);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Employees</h2>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Employee ID</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-3 py-2">{r.employeeId}</td>
                <td className="px-3 py-2">
                  <Link className="text-blue-600 underline" to={`/employees/${r._id}`}>{r.name}</Link>
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


