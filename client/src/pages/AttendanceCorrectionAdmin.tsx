import React, { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { AttendanceCorrectionReview } from "@/components/AttendanceCorrectionReview";
import { RefreshButton } from "@/shared/components/ui/refresh-button";

export function AttendanceCorrectionAdmin() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Correction Management</h1>
          <p className="text-muted-foreground">
            Review and manage employee attendance correction requests
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Pending Review</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Approved</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Rejected</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>All Requests</span>
            </TabsTrigger>
          </TabsList>
          <RefreshButton onRefresh={handleRefresh} showText />
        </div>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span>Pending Review</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Requires Action
                </Badge>
              </CardTitle>
              <CardDescription>
                Attendance correction requests waiting for your review
              </CardDescription>
            </CardHeader>
          </Card>
          <AttendanceCorrectionReview refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Approved Requests</span>
              </CardTitle>
              <CardDescription>
                Attendance correction requests that have been approved
              </CardDescription>
            </CardHeader>
          </Card>
          {/* This would use the same component but with status filter */}
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Approved requests will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Rejected Requests</span>
              </CardTitle>
              <CardDescription>
                Attendance correction requests that have been rejected
              </CardDescription>
            </CardHeader>
          </Card>
          {/* This would use the same component but with status filter */}
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Rejected requests will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>All Requests</span>
              </CardTitle>
              <CardDescription>
                Complete history of all attendance correction requests
              </CardDescription>
            </CardHeader>
          </Card>
          {/* This would use the same component but with no status filter */}
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All requests will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs >
    </div >
  );
}