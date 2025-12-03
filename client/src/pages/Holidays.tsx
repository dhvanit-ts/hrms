import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  const holidayDates = holidays.map(h => h.date.toDateString());

  const modifiers = {
    holiday: (date: Date) => holidayDates.includes(date.toDateString()),
  };

  const modifiersClassNames = {
    holiday: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-rose-500',
  };

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

  const selectedDateHolidays = holidays.filter(
    h => selectedDate && h.date.toDateString() === selectedDate.toDateString()
  );

  const upcomingHolidays = holidays
    .filter(h => h.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

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
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Total Holidays</p>
              <CalendarIcon className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-zinc-900">{holidays.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Upcoming</p>
              <CalendarIcon className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-zinc-900">{upcomingHolidays.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">This Month</p>
              <CalendarIcon className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-zinc-900">
                {holidays.filter(h =>
                  h.date.getMonth() === new Date().getMonth() &&
                  h.date.getFullYear() === new Date().getFullYear()
                ).length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Click on a date to see holidays</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
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
                      <div key={holiday.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{holiday.name}</p>
                          <div className="mt-1">{getTypeBadge(holiday.type)}</div>
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
                    <div key={holiday.id} className="flex items-start justify-between gap-2 pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{holiday.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {holiday.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="mt-1">{getTypeBadge(holiday.type)}</div>
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

      {/* All Holidays List */}
      <Card>
        <CardHeader>
          <CardTitle>All Holidays ({holidays.length})</CardTitle>
          <CardDescription>Complete list of holidays for the year</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/50 text-zinc-500">
                <tr>
                  <th className="h-10 px-6 py-3 font-medium">Holiday Name</th>
                  <th className="h-10 px-6 py-3 font-medium">Date</th>
                  <th className="h-10 px-6 py-3 font-medium">Day</th>
                  <th className="h-10 px-6 py-3 font-medium">Type</th>
                  {hasAdminAccess && <th className="h-10 px-6 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {holidays
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900">
                        {holiday.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600">
                        {holiday.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-600">
                        {holiday.date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(holiday.type)}
                      </td>
                      {hasAdminAccess && (
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidaysPage;
