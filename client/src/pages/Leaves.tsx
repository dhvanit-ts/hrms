import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { http } from '@/services/api/http';
import { useAuth } from '@/context/AuthContext';

// Helper to map status to badge variant
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent shadow-none"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-transparent shadow-none"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    case 'pending':
    default:
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent shadow-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  }
};

export const LeavesPage: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [type, setType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [balance, setBalance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function load() {
    if (!accessToken) return;
    try {
      const res = await http.get('/leaves/mine', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.data.leaves) return;
      setLeaves(res.data.leaves);
      const bal = await http.get('/leaves/balance', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setBalance(bal.data.balance);
    } catch (error) {
      console.error("Failed to load leave data", error);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoading(true);
    try {
      await http.post('/leaves',
        { employeeId: parseInt(user?.id!), type, startDate, endDate },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setStartDate('');
      setEndDate('');
      await load();
    } catch (error) {
      console.error("Failed to submit leave request", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">My Leaves</h2>
          <p className="text-sm text-zinc-500">Manage your leave requests and view balance.</p>
        </div>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-linear-to-br from-zinc-900 to-zinc-800 text-white border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">
                Remaining Balance ({balance.year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{balance.remaining}</span>
                <span className="text-sm text-zinc-400">/ {balance.allowance} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Submit a new leave application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Leave Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : (
                  <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Apply Request</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>A list of your recent leave applications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/50 text-zinc-500">
                  <tr>
                    <th className="h-10 px-6 py-3 font-medium">Type</th>
                    <th className="h-10 px-6 py-3 font-medium">Duration</th>
                    <th className="h-10 px-6 py-3 font-medium">Dates</th>
                    <th className="h-10 px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium capitalize text-zinc-900">
                          {l.type}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          {Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          <div className="flex flex-col text-xs">
                            <span>{new Date(l.startDate).toLocaleDateString()}</span>
                            <span className="text-zinc-400">to</span>
                            <span>{new Date(l.endDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(l.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeavesPage;