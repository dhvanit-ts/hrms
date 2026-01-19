import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Clock, Calendar, AlertCircle, CheckCircle, XCircle, RefreshCw, Ticket as TicketIcon, User, FileText, Search, Filter } from "lucide-react";
import { adminTicketsApi, type Ticket, type TicketStatistics, type TicketListQuery } from "@/services/api/tickets";
import { TicketDetail } from "../components/TicketDetail";
import { extractErrorMessage } from "@/lib/utils";
import { useAuth } from "@/shared/context/AuthContext";

export function TicketsAdmin() {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statistics, setStatistics] = useState<TicketStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [filters, setFilters] = useState<TicketListQuery>({
    status: "pending",
    page: 1,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [refreshTrigger, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!accessToken) {
        setError("Authentication required");
        return;
      }

      const [ticketsRes, statsRes] = await Promise.all([
        adminTicketsApi.getAllTickets(accessToken, filters),
        adminTicketsApi.getStatistics(accessToken),
      ]);

      // Ensure tickets is always an array
      setTickets(Array.isArray(ticketsRes.tickets) ? ticketsRes.tickets : []);
      setStatistics(statsRes.statistics);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to load tickets data:", err);
      setError(errorMessage);
      // Set empty arrays on error to prevent undefined access
      setTickets([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setFilters(prev => ({
      ...prev,
      status: tab === "all" ? undefined : tab,
      page: 1,
    }));
  };

  const handleViewTicket = async (ticket: Ticket) => {
    try {
      if (!accessToken) {
        setError("Authentication required");
        return;
      }

      // Validate ticket ID
      if (!ticket || !ticket.id || typeof ticket.id !== 'number') {
        setError("Invalid ticket selected");
        return;
      }

      // Get full ticket details
      const res = await adminTicketsApi.getTicketById(accessToken, ticket.id);
      setSelectedTicket(res.ticket);
      setShowDetailDialog(true);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to load ticket details:", err);
      setError(errorMessage);
    }
  };

  const handleTicketUpdate = () => {
    setShowDetailDialog(false);
    handleRefresh();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "under_review":
        return "default";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "under_review":
        return <AlertCircle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attendance_correction":
        return <Clock className="h-4 w-4" />;
      case "extra_leave_request":
        return <Calendar className="h-4 w-4" />;
      case "profile_change_request":
        return <User className="h-4 w-4" />;
      default:
        return <TicketIcon className="h-4 w-4" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(searchLower) ||
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.employee.name.toLowerCase().includes(searchLower) ||
      ticket.employee.employeeId.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Management</h1>
          <p className="text-muted-foreground">
            Review and manage employee tickets for attendance, leave, and profile changes
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets, employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "all" ? undefined : value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="attendance_correction">Attendance Correction</SelectItem>
                <SelectItem value="extra_leave_request">Extra Leave Request</SelectItem>
                <SelectItem value="profile_change_request">Profile Change</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.priority || "all"}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === "all" ? undefined : value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            Review and manage employee tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending ({statistics?.pending || 0})</TabsTrigger>
              <TabsTrigger value="under_review">Under Review ({statistics?.underReview || 0})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tickets found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "No tickets have been submitted yet."
                      : `No ${activeTab.replace("_", " ")} tickets found.`
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {ticket.employee.employeeId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(ticket.type)}
                            <span className="capitalize text-sm">
                              {ticket.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)} className="flex items-center space-x-1 w-fit">
                            {getStatusIcon(ticket.status)}
                            <span className="capitalize">
                              {ticket.status.replace(/_/g, " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="capitalize">
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              isAdmin={true}
              onClose={() => setShowDetailDialog(false)}
              onUpdate={handleTicketUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

