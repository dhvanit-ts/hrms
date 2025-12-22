import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Home, Building, AlertCircle } from 'lucide-react';
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiIndeterminateCircleFill,
  RiCloseCircleFill,
  RiRadioButtonFill,
  RiArrowRightSLine,
  RiArrowLeftSLine
} from '@remixicon/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

import { useAuth } from '@/shared/context/AuthContext';
import * as attendanceApi from '@/services/api/attendance';
import { ErrorAlert } from '@/shared/components/ui/error-alert';
import { extractErrorMessage } from '@/lib/utils';

// Helper function to get icon for attendance status
const getAttendanceIcon = (attendance: attendanceApi.Attendance | null) => {
  if (!attendance || !attendance.checkIn) {
    return <RiCloseCircleFill className="w-5 h-5 text-gray-600" />; // Absent
  }

  if (!attendance.checkOut) {
    return <RiRadioButtonFill className="w-5 h-5 text-yellow-500" />; // Active session
  }

  const duration = attendance.duration || 0;
  const hours = duration / (1000 * 60 * 60);
  const isLate = attendance.type?.includes('_LATE') || false;

  if (hours >= 8) return <RiCheckboxCircleFill className={`w-5 h-5 ${isLate ? 'text-orange-500' : 'text-green-500'}`} />; // Full day
  if (hours >= 6) return <RiErrorWarningFill className="w-5 h-5 text-orange-500" />; // Partial day
  if (hours >= 4) return <RiIndeterminateCircleFill className="w-5 h-5 text-yellow-500" />; // Half day
  return <RiCloseCircleFill className="w-5 h-5 text-red-500" />; // Short day
};

// Helper function to get status text
const getStatusText = (attendance: attendanceApi.Attendance | null) => {
  if (!attendance) return 'Absent';
  if (!attendance.checkIn) return 'Absent';
  if (!attendance.checkOut) return 'Active';

  const duration = attendance.duration || 0;
  const hours = duration / (1000 * 60 * 60);
  const isLate = attendance.type?.includes('_LATE') || false;

  let baseStatus = '';
  if (hours >= 8) baseStatus = 'Full Day';
  else if (hours >= 6) baseStatus = 'Partial';
  else if (hours >= 4) baseStatus = 'Half Day';
  else baseStatus = 'Short Day';

  return isLate ? `${baseStatus} (Late)` : baseStatus;
};

// Helper function to format duration
const formatDuration = (milliseconds: number | null) => {
  if (!milliseconds) return '0h 0m';
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Helper function to format time
const formatTime = (dateString: string | null) => {
  if (!dateString) return '--:--';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Generate calendar days for the current month
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
};

export const AttendancePage: React.FC = () => {
  const { employeeAccessToken, isEmployee } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<attendanceApi.Attendance[]>([]);
  const [todayStatus, setTodayStatus] = useState<attendanceApi.AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<attendanceApi.Attendance | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

  // Get current month and year
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Check if we're viewing the current month
  const today = new Date();
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  // Generate calendar days
  const calendarDays = useMemo(() =>
    generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, attendanceApi.Attendance>();
    attendanceHistory.forEach(attendance => {
      const dateKey = new Date(attendance.date).toDateString();
      map.set(dateKey, attendance);
    });
    return map;
  }, [attendanceHistory]);

  // Load attendance data
  const loadAttendanceData = async () => {
    if (!employeeAccessToken || !isEmployee) return;

    setIsLoading(true);
    try {
      // Get attendance history for the current month
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const [historyRes, statusRes] = await Promise.all([
        attendanceApi.getAttendanceHistory(employeeAccessToken, { startDate, endDate }),
        attendanceApi.getTodayStatus(employeeAccessToken)
      ]);

      setAttendanceHistory(historyRes.attendances);
      setTodayStatus(statusRes);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [employeeAccessToken, isEmployee, currentMonth, currentYear]);

  // Update selected day data when attendance history changes or selected date changes
  useEffect(() => {
    const dateKey = selectedDate.toDateString();
    const dayAttendance = attendanceMap.get(dateKey) || null;
    setSelectedDayData(dayAttendance);
  }, [attendanceMap, selectedDate]);

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Jump to today
  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (!isEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">This page is only available for employees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Error Message */}
      {errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
          autoDismiss={true}
          dismissAfter={5000}
        />
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">My Attendance</h2>
          <p className="text-sm text-zinc-500">Track your daily attendance and work hours</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Selected Day Status Card */}
      <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getAttendanceIcon(selectedDayData)}
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Status"
              : `${selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-zinc-500">Check In</p>
                <p className="font-medium">{formatTime(selectedDayData?.checkIn || null)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-xs text-zinc-500">Check Out</p>
                <p className="font-medium">{formatTime(selectedDayData?.checkOut || null)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-zinc-500">Duration</p>
                <p className="font-medium">{formatDuration(selectedDayData?.duration || null)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getStatusText(selectedDayData)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{monthName}</CardTitle>
              <div className="flex gap-2">
                {!isCurrentMonth && (
                  <Button variant="default" size="sm" onClick={jumpToToday}>
                    Today
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <RiArrowLeftSLine />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <RiArrowRightSLine />
                </Button>
              </div>
            </div>
            <CardDescription>Click on any day to see detailed attendance information</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-zinc-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2"></div>;
                }

                const dateKey = day.toDateString();
                const attendance = attendanceMap.get(dateKey) || null;
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isFuture = day > new Date();
                const icon = getAttendanceIcon(attendance);

                return (
                  <div
                    key={index}
                    className={`
                      p-2 text-center rounded-lg border transition-colors
                      ${isFuture
                        ? 'cursor-not-allowed opacity-70 bg-gray-50 text-gray-900'
                        : 'cursor-pointer'
                      }
                      ${!isFuture && isSelected ? 'bg-blue-200 border-blue-400 ring-2 ring-blue-300' :
                        !isFuture && isToday ? 'bg-blue-100 border-blue-300' :
                          !isFuture ? 'hover:bg-zinc-50' : ''}
                    `}
                    title={isFuture ? 'Future date' : `${day.getDate()} - ${getStatusText(attendance)}`}
                    onClick={isFuture ? undefined : () => handleDateClick(day)}
                  >
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    <div className="flex justify-center">{isFuture ? <div className="w-5 h-5"></div> : icon}</div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="w-4 h-4 text-green-500" />
                  <span>Full Day (8+ hrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RiErrorWarningFill className="w-4 h-4 text-orange-500" />
                  <span>Partial (6-8 hrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RiIndeterminateCircleFill className="w-4 h-4 text-yellow-500" />
                  <span>Half Day (4-6 hrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RiCloseCircleFill className="w-4 h-4 text-red-500" />
                  <span>Short Day (&lt;4 hrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RiRadioButtonFill className="w-4 h-4 text-yellow-500" />
                  <span>Active Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <RiCloseCircleFill className="w-4 h-4 text-gray-600" />
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Timeline - {monthName}</CardTitle>
            <CardDescription>Chronological view of your attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No attendance records found for this month.
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((attendance) => (
                    <div key={attendance.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-zinc-50">
                      <div className="flex items-center justify-center w-8 h-8">{getAttendanceIcon(attendance)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {new Date(attendance.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(attendance)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-green-600" />
                            <span>In: {formatTime(attendance.checkIn)}</span>
                            {attendance.type?.includes('_LATE') && (
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-600" />
                            <span>Out: {formatTime(attendance.checkOut)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-blue-600" />
                            <span>Duration: {formatDuration(attendance.duration)}</span>
                          </div>
                          {attendance.type && (
                            <div className="flex items-center gap-1">
                              {attendance.type.includes('WFH') ? (
                                <Home className="w-3 h-3 text-purple-600" />
                              ) : (
                                <Building className="w-3 h-3 text-blue-600" />
                              )}
                              <span>{attendance.type.replace('_LATE', '')}</span>
                              {attendance.type.includes('_LATE') && (
                                <span className="text-xs text-amber-600">(Late)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendancePage;