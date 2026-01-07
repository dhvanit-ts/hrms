import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Clock, Calendar, Plus, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import { getAttendanceHistory, type Attendance } from "@/services/api/attendance";
import { AttendanceCorrectionRequest } from "@/components/AttendanceCorrectionRequest";
import { AttendanceCorrectionHistory } from "@/components/AttendanceCorrectionHistory";
import { extractErrorMessage } from "@/lib/utils";

export function AttendanceCorrections() {
  const { employeeAccessToken: accessToken } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (accessToken) {
      loadAttendanceHistory();
    }
  }, [accessToken]);

  const loadAttendanceHistory = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Get last 30 days of attendance
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await getAttendanceHistory(accessToken, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      setAttendanceHistory(data.attendances);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error('Failed to load attendance history:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCorrection = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setShowRequestDialog(true);
  };

  const handleRequestSuccess = () => {
    setShowRequestDialog(false);
    setSelectedAttendance(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRequestCancel = () => {
    setShowRequestDialog(false);
    setSelectedAttendance(null);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Not recorded";
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

  const getAttendanceTypeDisplay = (record: Attendance) => {
    if (!record.type) return '-';

    if (record.type.includes('_LATE')) {
      const baseType = record.type.replace('_LATE', '');
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {baseType}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Late
          </Badge>
        </div>
      );
    }

    return <Badge variant="outline">{record.type}</Badge>;
  };

  const canRequestCorrection = (record: Attendance) => {
    // Can request correction if there's any attendance data (check-in or check-out)
    // or if there's missing data that needs to be added
    return record.checkIn || record.checkOut || (!record.checkIn && !record.checkOut);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading attendance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Corrections</h1>
          <p className="text-muted-foreground">
            Request corrections for your attendance records
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Attendance Records</span>
          </CardTitle>
          <CardDescription>
            Select an attendance record to request a correction (Last 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No attendance records found</p>
              <p className="text-sm text-muted-foreground">
                Attendance records will appear here once you start checking in
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>
                      {getAttendanceTypeDisplay(record)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {formatTime(record.checkIn)}
                        {record.type?.includes('_LATE') && (
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(record.checkOut)}</TableCell>
                    <TableCell>{formatDuration(record.duration)}</TableCell>
                    <TableCell>
                      {canRequestCorrection(record) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestCorrection(record)}
                          className="flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Request Correction</span>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No correction needed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Correction Request History */}
      <AttendanceCorrectionHistory refreshTrigger={refreshTrigger} />

      {/* Request Correction Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Attendance Correction</DialogTitle>
            <DialogDescription>
              Submit a request to correct your attendance record for{" "}
              {selectedAttendance && formatDate(selectedAttendance.date)}
            </DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <AttendanceCorrectionRequest
              attendance={{
                id: selectedAttendance.id,
                date: selectedAttendance.date,
                checkIn: selectedAttendance.checkIn ?? undefined,
                checkOut: selectedAttendance.checkOut ?? undefined,
              }}
              onSuccess={handleRequestSuccess}
              onCancel={handleRequestCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}