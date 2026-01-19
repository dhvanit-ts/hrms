import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Clock, Calendar, Plus, AlertCircle, CheckCircle, XCircle, RefreshCw, Ticket as TicketIcon, User, FileText } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import { employeeTicketsApi, ticketsApi, type Ticket, type TicketStatistics, type TicketCategories } from "@/services/api/tickets";
import { TicketForm } from "../components/TicketForm";
import { TicketDetail } from "../components/TicketDetail";
import { extractErrorMessage } from "@/lib/utils";

export function Tickets() {
  const { employeeAccessToken: accessToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statistics, setStatistics] = useState<TicketStatistics | null>(null);
  const [categories, setCategories] = useState<TicketCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken, refreshTrigger]);

  const loadData = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🎫 Starting to load tickets data...");
      console.log("🎫 Access token available:", !!accessToken);

      // Load data sequentially to better identify which call is failing
      console.log("🎫 Loading categories...");
      const categoriesRes = await ticketsApi.getCategories();
      console.log("🎫 Categories response:", categoriesRes);

      // Ensure categories has the expected structure
      const loadedCategories = categoriesRes?.categories || {
        attendance_correction: ["late_checkin", "early_checkout", "missing_checkin", "missing_checkout"],
        extra_leave_request: ["emergency_leave", "extended_leave", "unpaid_leave"],
        profile_change_request: ["personal_info", "employment_details", "contact_details"],
      };

      console.log("🎫 Setting categories:", loadedCategories);
      setCategories(loadedCategories);

      console.log("🎫 Loading tickets...");
      const ticketsRes = await employeeTicketsApi.getMyTickets(accessToken);
      console.log("🎫 Tickets response:", ticketsRes);
      setTickets(Array.isArray(ticketsRes.tickets) ? ticketsRes.tickets : []);

      console.log("🎫 Loading statistics...");
      const statsRes = await employeeTicketsApi.getMyStatistics(accessToken);
      console.log("🎫 Statistics response:", statsRes);
      setStatistics(statsRes.statistics);

      console.log("🎫 All data loaded successfully");
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("🎫 Failed to load tickets data:", err);
      console.error("🎫 Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(errorMessage);
      // Set empty arrays on error to prevent undefined access
      setTickets([]);
      setStatistics(null);
      setCategories(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTicketCreated = () => {
    setShowCreateDialog(false);
    handleRefresh();
  };

  const handleViewTicket = async (ticket: Ticket) => {
    try {
      // Get full ticket details
      const res = await employeeTicketsApi.getMyTicketById(accessToken!, ticket.id);
      setSelectedTicket(res.ticket);
      setShowDetailDialog(true);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      console.error("Failed to load ticket details:", err);
      setError(errorMessage);
    }
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

  const filteredTickets = tickets?.filter(ticket => {
    if (activeTab === "all") return true;
    return ticket.status === activeTab;
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
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">
            Submit and track your requests for attendance corrections, leave, and profile changes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Submit a request for attendance correction, extra leave, or profile changes
                </DialogDescription>
              </DialogHeader>
              {categories ? (
                <TicketForm
                  categories={categories}
                  onSuccess={handleTicketCreated}
                  onCancel={() => setShowCreateDialog(false)}
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading form...</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            View and manage your submitted tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredTickets?.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tickets found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "You haven't submitted any tickets yet."
                      : `No ${activeTab.replace("_", " ")} tickets found.`
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets?.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(ticket.type)}
                            <span className="capitalize">
                              {ticket.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)} className="flex items-center space-x-1 w-fit">
                            {getStatusIcon(ticket.status)}
                            <span className="capitalize">
                              {ticket.status.replace(/_/g, " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View
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
              onClose={() => setShowDetailDialog(false)}
              onUpdate={handleRefresh}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
