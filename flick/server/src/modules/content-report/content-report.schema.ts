import z from "zod";

const ContentReportStatus = z.enum(["pending", "resolved", "ignored"])

export const CreateReportSchema = z.object({
  targetId: z.string().min(1, "Target ID is required"),
  type: z.enum(["Post", "Comment"]),
  reason: z.string().min(1, "Reason is required"),
  message: z.string().min(1, "Message is required")
});

export const UpdateReportStatusSchema = z.object({
  status: ContentReportStatus
});

export const ReportParamsSchema = z.object({
  id: z.uuid("Invalid report ID")
});

export const UserReportsParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, "Invalid user ID")
});

export const GetReportsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(["Post", "Comment", "Both"]).optional().default("Both"),
  status: z
    .string()
    .optional()
    .transform(val => val?.split(",") ?? ["pending"])
    .pipe(z.array(ContentReportStatus)),
  fields: z.string().optional()
});

export const BulkDeleteReportsSchema = z.object({
  reportIds: z.array(z.uuid("Invalid report ID"))
});

export const UpdateContentStatusSchema = z.object({
  action: z.enum(["ban", "unban", "shadowBan", "shadowUnban"]),
  type: z.enum(["Post", "Comment"])
});

export const ContentParamsSchema = z.object({
  targetId: z.string().regex(/^\d+$/, "Invalid target ID")
});

export const UserParamsSchema = z.object({
  userId: z.uuid("Invalid user ID")
});

export const SuspendUserSchema = z.object({
  ends: z.iso.datetime("Invalid end date"),
  reason: z.string().min(1, "Reason is required")
});

export const GetUsersQuerySchema = z.object({
  email: z.email().optional(),
  username: z.string().min(1).optional()
}).refine(data => data.email || data.username, {
  message: "Either email or username must be provided"
});