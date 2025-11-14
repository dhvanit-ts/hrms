import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { http } from '../services/api/http';

export const Leaves: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [type, setType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [balance, setBalance] = useState<any | null>(null);
  const headers = { Authorization: `Bearer ${accessToken}` };

  async function load() {
    const res = await http.get('/leaves/mine', { headers });
    setLeaves(res.data.leaves);
    const bal = await http.get('/leaves/balance', { headers });
    setBalance(bal.data.balance);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await http.post('/leaves', { employeeId: user?.id, type, startDate, endDate }, { headers });
    setStartDate('');
    setEndDate('');
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">My Leaves</h2>
      <form onSubmit={submit} className="flex gap-3 items-end">
        <div>
          <label className="text-sm">Type</label>
          <select className="border rounded px-2 py-2 block" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Start</label>
          <input className="border rounded px-2 py-2 block" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm">End</label>
          <input className="border rounded px-2 py-2 block" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <button className="px-3 py-2 border rounded" type="submit">Apply</button>
      </form>
      {balance && (
        <div className="text-sm text-gray-700">
          Balance {balance.year}: {balance.remaining}/{balance.allowance} days remaining
        </div>
      )}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Start</th>
              <th className="text-left px-3 py-2">End</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l._id} className="border-t">
                <td className="px-3 py-2">{l.type}</td>
                <td className="px-3 py-2">{new Date(l.startDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(l.endDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


