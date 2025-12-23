import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Spinner } from '@/shared/components/ui/spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export interface PendingLeave {
  id: number;
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string | null;
  createdAt: string;
  employee: {
    name: string;
    department: {
      id: number;
      name: string;
    };
    email: string;
  };
}

interface PendingLeavesTableProps {
  leaves: PendingLeave[];
  isLoading: boolean;
  onApprove: (leaveId: number) => Promise<void>;
  onReject: (leaveId: number) => Promise<void>;
  onFilterChange: (filters: { department?: string; startDate?: string; endDate?: string }) => void;
}

export const PendingLeavesTable: React.FC<PendingLeavesTableProps> = ({
  leaves,
  isLoading,
  onApprove,
  onReject,
  onFilterChange,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [processingLeaveId, setProcessingLeaveId] = useState<number | null>(null);

  // Apply filters when they change
  useEffect(() => {
    const filters: { department?: string; startDate?: string; endDate?: string } = {};
    if (departmentFilter) filters.department = departmentFilter;
    if (startDateFilter) filters.startDate = startDateFilter;
    if (endDateFilter) filters.endDate = endDateFilter;
    onFilterChange(filters);
  }, [departmentFilter, startDateFilter, endDateFilter, onFilterChange]);

  const handleApprove = async (leaveId: number) => {
    setProcessingLeaveId(leaveId);
    try {
      await onApprove(leaveId);
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleReject = async (leaveId: number) => {
    setProcessingLeaveId(leaveId);
    try {
      await onReject(leaveId);
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Leave Requests</CardTitle>
        <CardDescription>Review and manage employee leave applications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-zinc-700 mb-1 block">
              Department
            </label>
            <Input
              placeholder="Filter by department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-1 block">
              Start Date
            </label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-1 block">
              End Date
            </label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDepartmentFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                      No pending leave requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-zinc-900">{leave.employee.name}</span>
                          <span className="text-xs text-zinc-500">{leave.employee.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{leave.employee.department.name}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{leave.type}</TableCell>
                      <TableCell>
                        {calculateDuration(leave.startDate, leave.endDate)} days
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                          <span className="text-zinc-400">to</span>
                          <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {leave.reason || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                disabled={processingLeaveId === leave.id}
                              >
                                {processingLeaveId === leave.id ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve leave?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this leave request for {leave.employee.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogAction onClick={() => handleApprove(leave.id)}>Approve</AlertDialogAction>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(leave.id)}
                            disabled={processingLeaveId === leave.id}
                          >
                            {processingLeaveId === leave.id ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
