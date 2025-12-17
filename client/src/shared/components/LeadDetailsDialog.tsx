import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Phone, Mail, Building, Calendar, User, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { leadsApi, type Lead, type LeadActivity, type AddActivityData } from "../../services/api/leads";

const addActivitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "note", "task"]),
  description: z.string().min(1, "Description is required"),
});

type AddActivityForm = z.infer<typeof addActivitySchema>;

interface LeadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  proposal: "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-red-100 text-red-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const activityTypeColors = {
  call: "bg-green-100 text-green-800",
  email: "bg-blue-100 text-blue-800",
  meeting: "bg-purple-100 text-purple-800",
  note: "bg-gray-100 text-gray-800",
  task: "bg-orange-100 text-orange-800",
};

export function LeadDetailsDialog({ open, onOpenChange, lead }: LeadDetailsDialogProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddActivityForm>({
    resolver: zodResolver(addActivitySchema),
  });

  const activityType = watch("type");

  const fetchActivities = async () => {
    if (!lead) return;
    try {
      const data = await leadsApi.getLeadActivities(lead.id);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  useEffect(() => {
    if (open && lead) {
      fetchActivities();
    }
  }, [open, lead]);

  const onSubmitActivity = async (data: AddActivityForm) => {
    try {
      setLoading(true);
      const activityData: AddActivityData = {
        type: data.type,
        description: data.description,
      };
      await leadsApi.addActivity(lead.id, activityData);
      reset();
      setShowAddActivity(false);
      fetchActivities();
    } catch (error) {
      console.error("Failed to add activity:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{lead.name}</h3>
                {lead.position && (
                  <p className="text-gray-600">{lead.position}</p>
                )}
              </div>

              <div className="space-y-2">
                {lead.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{lead.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{lead.email}</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.manager && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Assigned to: {lead.manager.email}</span>
                  </div>
                )}
                {lead.value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>${lead.value.toLocaleString()}</span>
                  </div>
                )}
                {lead.followUpDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Follow up: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Badge className={statusColors[lead.status]}>
                  {lead.status.replace("_", " ")}
                </Badge>
                <Badge className={priorityColors[lead.priority]}>
                  {lead.priority}
                </Badge>
              </div>

              {lead.source && (
                <div>
                  <Label>Source</Label>
                  <p className="text-sm text-gray-600">{lead.source}</p>
                </div>
              )}

              {lead.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activities</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddActivity(!showAddActivity)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Activity Form */}
              {showAddActivity && (
                <form onSubmit={handleSubmit(onSubmitActivity)} className="space-y-3 p-3 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="type">Activity Type</Label>
                    <Select
                      value={activityType}
                      onValueChange={(value) => setValue("type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Describe the activity..."
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading ? "Adding..." : "Add Activity"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddActivity(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Activities List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No activities yet</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={activityTypeColors[activity.type]}>
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        by {activity.user.email}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}