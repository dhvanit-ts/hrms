import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
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

interface Holiday {
  id: number;
  name: string;
  date: Date;
  type: 'public' | 'company' | 'optional';
}

export const HolidaysPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: 1, name: "New Year's Day", date: new Date(2025, 0, 1), type: 'public' },
    { id: 2, name: "Independence Day", date: new Date(2025, 6, 4), type: 'public' },
    { id: 3, name: "Christmas", date: new Date(2025, 11, 25), type: 'public' },
    { id: 4, name: "Company Anniversary", date: new Date(2025, 2, 15), type: 'company' },
  ]);

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<'public' | 'company' | 'optional'>('public');

  const hasAdminAccess = isAdmin && user?.roles?.some(role =>
    ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(role)
  );

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;

    const newHoliday: Holiday = {
      id: Date.now(),
      name: newHolidayName,
      date: new Date(newHolidayDate),
      type: newHolidayType,
    };

    setHolidays([...holidays, newHoliday]);
    setNewHolidayName('');
    setNewHolidayDate('');
    setNewHolidayType('public');
  };

  const handleDeleteHoliday = (id: number) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      setHolidays(holidays.filter(h => h.id !== id));
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'public':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent">Public</Badge>;
      case 'company':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent">Company</Badge>;
      case 'optional':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent">Optional</Badge>;
      default:
        return null;
    }
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
                          className={`text-xs px-2 py-1 rounded truncate ${holiday.type === 'public'
                              ? 'bg-blue-100 text-blue-700'
                              : holiday.type === 'company'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
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
                        <div className="mt-2">{getTypeBadge(holiday.type)}</div>
                      </div>
                      {hasAdminAccess && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                      <div className="mt-2">{getTypeBadge(holiday.type)}</div>
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

      {/* Admin: Add Holiday Form */}
      {hasAdminAccess && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Holiday</CardTitle>
            <CardDescription>Create a new holiday entry for the calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={newHolidayType}
                    onChange={(e) => setNewHolidayType(e.target.value as any)}
                  >
                    <option value="public">Public Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="optional">Optional Holiday</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Holiday
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HolidaysPage;
