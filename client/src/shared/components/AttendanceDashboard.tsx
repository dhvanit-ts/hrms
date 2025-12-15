import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  punchIn,
  punchOut,
  getAttendanceHistory,
  getTodayStatus,
  startBreak,
  endBreak,
  getBreakStatus,
  type Attendance,
  type AttendanceStatus,
  type BreakStatus,
} from '@/services/api/attendance';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';

export function AttendanceDashboard() {
  const { employeeAccessToken: accessToken } = useAuth();
  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
  const [breakStatus, setBreakStatus] = useState<BreakStatus | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'punch-in' | 'punch-out' | 'start-break' | 'end-break' | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [statusData, historyData, breakData] = await Promise.all([
        getTodayStatus(accessToken),
        getAttendanceHistory(accessToken),
        getBreakStatus(accessToken),
      ]);

      setTodayStatus(statusData);
      setHistory(historyData.attendances);
      setBreakStatus(breakData);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to load attendance data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = async () => {
    if (!accessToken) return;

    setActionLoading('punch-in');
    setError(null);

    try {
      await punchIn(accessToken);
      await loadData();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to punch in:', err);
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePunchOut = async () => {
    if (!accessToken) return;

    setActionLoading('punch-out');
    setError(null);

    try {
      await punchOut(accessToken);
      await loadData();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to punch out:', err);
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartBreak = async () => {
    if (!accessToken) return;

    setActionLoading('start-break');
    setError(null);

    try {
      await startBreak(accessToken);
      await loadData();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to start break:', err);
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndBreak = async () => {
    if (!accessToken) return;

    setActionLoading('end-break');
    setError(null);

    try {
      await endBreak(accessToken);
      await loadData();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to end break:', err);
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    loadData()
  }, [])

  if (loading && !todayStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          autoDismiss={true}
          dismissAfter={5000}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayStatus?.hasActiveSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">Active Session</Badge>
                {todayStatus.attendance?.type && (
                  <Badge variant="outline">{todayStatus.attendance.type}</Badge>
                )}
                {breakStatus?.hasActiveBreak && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent">On Break</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Punch In</p>
                  <p className="text-lg font-semibold">
                    {formatTime(todayStatus.attendance?.checkIn || null)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Punch Out</p>
                  <p className="text-lg font-semibold">
                    {formatTime(todayStatus.attendance?.checkOut || null)}
                  </p>
                </div>
              </div>

              {breakStatus && breakStatus.totalBreakTime > 0 && (
                <div className="p-3 bg-zinc-50 rounded-md">
                  <p className="text-sm text-muted-foreground">Total Break Time</p>
                  <p className="text-lg font-semibold">{formatDuration(breakStatus.totalBreakTime)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {breakStatus?.hasActiveBreak ? (
                  <Button
                    onClick={handleEndBreak}
                    disabled={actionLoading !== null}
                    variant="outline"
                    className="w-full"
                  >
                    {actionLoading === 'end-break' ? 'Ending...' : 'End Break'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartBreak}
                    disabled={actionLoading !== null}
                    variant="outline"
                    className="w-full"
                  >
                    {actionLoading === 'start-break' ? 'Starting...' : 'Start Break'}
                  </Button>
                )}
                <Button
                  onClick={handlePunchOut}
                  disabled={actionLoading !== null || breakStatus?.hasActiveBreak}
                  variant="outline"
                  className="w-full"
                >
                  {actionLoading === 'punch-out' ? 'Punching Out...' : 'Punch Out'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No active session</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handlePunchIn}
                  disabled={actionLoading !== null}
                  className="w-full"
                >
                  {actionLoading === 'punch-in' ? 'Punching In...' : 'Punch In - Office'}
                </Button>
                <Button
                  onClick={handlePunchIn}
                  disabled={actionLoading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {actionLoading === 'punch-in' ? 'Punching In...' : 'Punch In - WFH'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendance records found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {record.type ? (
                        <Badge variant="outline">{record.type}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatTime(record.checkIn)}</TableCell>
                    <TableCell>{formatTime(record.checkOut)}</TableCell>
                    <TableCell>{formatDuration(record.duration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
