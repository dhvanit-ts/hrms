import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
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
  type AttendanceHistoryParams,
} from '@/services/api/attendance';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';
import { useEmployeeEmploymentDates } from '@/shared/hooks/useEmployeeEmploymentDates';
import { getEmploymentDateConstraints } from '@/lib/dateConstraints';
import { EmploymentDateInfo } from '@/shared/components/ui/employment-date-info';
import { ConstrainedDateInput } from '@/shared/components/ui/constrained-date-input';

export function AttendanceDashboard() {
  const { employeeAccessToken: accessToken } = useAuth();
  const { employmentDates } = useEmployeeEmploymentDates();
  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
  const [breakStatus, setBreakStatus] = useState<BreakStatus | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'punch-in' | 'punch-out' | 'start-break' | 'end-break' | null>(null);

  // Date filter state
  const [dateFilters, setDateFilters] = useState<AttendanceHistoryParams>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const loadData = async (filters?: AttendanceHistoryParams) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [statusData, historyData, breakData] = await Promise.all([
        getTodayStatus(accessToken),
        getAttendanceHistory(accessToken, filters),
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
    if (!minutes && minutes !== 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleFilterChange = (filters: AttendanceHistoryParams) => {
    setDateFilters(filters);
    loadData(filters);
  };

  const clearFilters = () => {
    setDateFilters({});
    loadData();
  };

  // Get date constraints for filter inputs
  const dateConstraints = getEmploymentDateConstraints(employmentDates);

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
          <div className="flex justify-between items-center">
            <CardTitle>Attendance History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Filter by Date'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <ConstrainedDateInput
                    value={dateFilters.startDate || ''}
                    onChange={(value) => handleFilterChange({ ...dateFilters, startDate: value || undefined })}
                    employmentDates={employmentDates}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <ConstrainedDateInput
                    value={dateFilters.endDate || ''}
                    onChange={(value) => handleFilterChange({ ...dateFilters, endDate: value || undefined })}
                    employmentDates={employmentDates}
                  />
                </div>
              </div>

              <EmploymentDateInfo employmentDates={employmentDates} />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!dateFilters.startDate && !dateFilters.endDate}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

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
