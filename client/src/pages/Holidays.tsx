import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/shared/context/AuthContext';
import { holidaysApi, Holiday as ApiHoliday } from '@/services/api/holidays';

interface Holiday {
  id: number;
  name: string;
  date: Date;
  description?: string;
  isRecurring: boolean;
}

export const HolidaysPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');
  const [newHolidayRecurring, setNewHolidayRecurring] = useState(false);

  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const hasAdminAccess = isAdmin && user?.roles?.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(role)
  );

  useEffect(() => {
    fetchHolidays();
  }, [currentDate]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const year = currentDate.getFullYear();
      const data = await holidaysApi.getAll(year);
      const mappedHolidays = (data || []).map(h => ({
        ...h,
        date: new Date(h.date),
      }));
      setHolidays(mappedHolidays);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;

    try {
      const dateObj = new Date(newHolidayDate);
      dateObj.setHours(12, 0, 0, 0);

      await holidaysApi.create({
        name: newHolidayName,
        date: dateObj.toISOString(),
        description: newHolidayDescription || undefined,
        isRecurring: newHolidayRecurring,
      });

      setNewHolidayName('');
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setNewHolidayRecurring(false);
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create holiday');
    }
  };

  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday || !newHolidayName || !newHolidayDate) return;

    try {
      const dateObj = new Date(newHolidayDate);
      dateObj.setHours(12, 0, 0, 0);

      await holidaysApi.update(editingHoliday.id, {
        name: newHolidayName,
        date: dateObj.toISOString(),
        description: newHolidayDescription || undefined,
        isRecurring: newHolidayRecurring,
      });

      setEditingHoliday(null);
      setNewHolidayName('');
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setNewHolidayRecurring(false);
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update holiday');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await holidaysApi.delete(id);
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const startEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setNewHolidayName(holiday.name);
    setNewHolidayDate(holiday.date.toISOString().split('T')[0]);
    setNewHolidayDescription(holiday.description || '');
    setNewHolidayRecurring(holiday.isRecurring);
  };

  const cancelEdit = () => {
    setEditingHoliday(null);
    setNewHolidayName('');
    setNewHolidayDate('');
    setNewHolidayDescription('');
    setNewHolidayRecurring(false);
  };

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const getHolidaysForDate = (date: Date) => {
    return holidays.filter(h => isSameDay(h.date, date));
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];
  const upcomingHolidays = holidays
    .filter(h => h.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading holidays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Holiday Calendar</h2>
          <p className="text-sm text-zinc-500">
            View company holidays and plan your time off
          </p>
        </div>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Full Page Calendar */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{monthName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Calendar Grid */}
          <div className="w-full">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b bg-zinc-50/50">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center text-sm font-semibold text-zinc-600 border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[120px] border-b border-r last:border-r-0 bg-zinc-50/30"
                    />
                  );
                }

                const dayHolidays = getHolidaysForDate(date);
                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[120px] border-b border-r last:border-r-0 p-2 cursor-pointer transition-colors hover:bg-zinc-50 ${isSelectedDay ? 'bg-blue-50' : ''
                      }`}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-2 ${isCurrentDay
                        ? 'bg-blue-600 text-white'
                        : isSelectedDay
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-zinc-700'
                        }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Holiday Events */}
                    <div className="space-y-1">
                      {dayHolidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="text-xs px-2 py-1 rounded truncate bg-blue-100 text-blue-700"
                          title={holiday.name}
                        >
                          {holiday.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details & Upcoming Holidays */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Selected Date Info */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateHolidays.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateHolidays.map(holiday => (
                    <div key={holiday.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{holiday.name}</p>
                        {holiday.description && (
                          <p className="text-xs text-zinc-500 mt-1">{holiday.description}</p>
                        )}
                        {holiday.isRecurring && (
                          <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200 border-transparent text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      {hasAdminAccess && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditHoliday(holiday)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No holidays on this date</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {upcomingHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{holiday.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {holiday.date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {holiday.isRecurring && (
                        <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200 border-transparent text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No upcoming holidays</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin: Add/Edit Holiday Form */}
      {hasAdminAccess && (
        <Card>
          <CardHeader>
            <CardTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</CardTitle>
            <CardDescription>
              {editingHoliday ? 'Update holiday details' : 'Create a new holiday entry for the calendar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingHoliday ? handleUpdateHoliday : handleAddHoliday} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Holiday Name</label>
                  <Input
                    placeholder="e.g. New Year's Day"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Date</label>
                  <Input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Description (Optional)</label>
                <Input
                  placeholder="e.g. National holiday celebrating..."
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newHolidayRecurring}
                  onChange={(e) => setNewHolidayRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-zinc-700">
                  Recurring annually
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="w-full md:w-auto">
                  {editingHoliday ? (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Update Holiday
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Holiday
                    </>
                  )}
                </Button>
                {editingHoliday && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HolidaysPage;
