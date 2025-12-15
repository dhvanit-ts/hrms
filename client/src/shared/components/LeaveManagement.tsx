import React, { useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import {
    applyLeave,
    getMyLeaves,
    getLeaveBalance,
    type LeaveRequest,
    type LeaveBalance,
    type ApplyLeaveParams,
} from "@/services/api/leaves";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Spinner } from "@/shared/components/ui/spinner";
import { ErrorAlert } from "@/shared/components/ui/error-alert";
import { extractErrorMessage } from "@/lib/utils";

export const LeaveManagement: React.FC = () => {
    const { employeeAccessToken: accessToken } = useAuth();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<
        "all" | "pending" | "approved" | "rejected"
    >("all");

    // Form state
    const [formData, setFormData] = useState<ApplyLeaveParams>({
        type: "Annual",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (accessToken) {
            fetchLeaves();
            fetchBalance();
        }
    }, [accessToken, filterStatus]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchLeaves = async () => {
        if (!accessToken) return;

        setLoading(true);
        setError(null);
        try {
            const params =
                filterStatus !== "all" ? { status: filterStatus } : undefined;
            const data = await getMyLeaves(accessToken, params);
            setLeaves(data.leaves);
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error("Failed to load leave history:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        if (!accessToken) return;

        try {
            const data = await getLeaveBalance(accessToken);
            setBalance(data.balance);
        } catch (err: any) {
            console.error("Failed to load leave balance:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        // Client-side date validation
        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);

            if (endDate < startDate) {
                setFormError("End date cannot be before start date");
                return;
            }
        }

        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        try {
            await applyLeave(accessToken, formData);
            // Reset form
            setFormData({
                type: "Annual",
                startDate: "",
                endDate: "",
                reason: "",
            });
            // Show success message
            setSuccessMessage("Leave application submitted successfully!");
            // Refresh data
            await fetchLeaves();
            await fetchBalance();
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err);
            console.error("Failed to submit leave application:", err);
            setFormError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge variant="default" className="bg-green-600">
                        Approved
                    </Badge>
                );
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            case "pending":
                return (
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Leave Balance Card */}
            {balance && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Leave Balance ({balance.year})
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Allowance</p>
                            <p className="text-2xl font-bold">{balance.allowance} days</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Used</p>
                            <p className="text-2xl font-bold">{balance.usedDays} days</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Remaining</p>
                            <p className="text-2xl font-bold text-green-600">
                                {balance.remaining} days
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Application Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Leave Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value })
                                }
                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                required
                            >
                                <option value="Annual">Annual Leave</option>
                                <option value="Sick">Sick Leave</option>
                                <option value="Personal">Personal Leave</option>
                                <option value="Emergency">Emergency Leave</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Start Date
                            </label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                End Date
                            </label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Reason (Optional)
                            </label>
                            <Input
                                type="text"
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({ ...formData, reason: e.target.value })
                                }
                                placeholder="Enter reason"
                            />
                        </div>
                    </div>

                    {formError && (
                        <ErrorAlert
                            message={formError}
                            onDismiss={() => setFormError(null)}
                            autoDismiss={true}
                            dismissAfter={5000}
                        />
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative">
                            <span className="block sm:inline">{successMessage}</span>
                            <button
                                type="button"
                                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                                onClick={() => setSuccessMessage(null)}
                            >
                                <span className="text-green-500 text-xl">&times;</span>
                            </button>
                        </div>
                    )}

                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner className="mr-2" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Leave Application"
                        )}
                    </Button>
                </form>
            </div>

            {/* Leave History */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Leave History</h3>
                    <div className="flex gap-2">
                        <Button
                            variant={filterStatus === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus("all")}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterStatus === "pending" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus("pending")}
                        >
                            Pending
                        </Button>
                        <Button
                            variant={filterStatus === "approved" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus("approved")}
                        >
                            Approved
                        </Button>
                        <Button
                            variant={filterStatus === "rejected" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus("rejected")}
                        >
                            Rejected
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : error ? (
                    <ErrorAlert
                        message={error}
                        onDismiss={() => setError(null)}
                        autoDismiss={true}
                        dismissAfter={5000}
                    />
                ) : leaves.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        No leave applications found
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Applied On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium">
                                        {leave.type}
                                    </TableCell>
                                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                    <TableCell>
                                        {leave.reason || <span className="text-gray-400">-</span>}
                                    </TableCell>
                                    <TableCell>{formatDate(leave.createdAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};
