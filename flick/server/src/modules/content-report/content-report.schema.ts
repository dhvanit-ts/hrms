import z from "zod";

export const createReportSchema = z.object({
  targetId: z.string().min(1, "Target ID is required"),
  type: z.enum(["Post", "Comment"]),
  reason: z.string().min(1, "Reason is required"),
  message: z.string().min(1, "Message is required")
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["pending", "resolved", "ignored"])
});

export const reportParamsSchema = z.object({
  id: z.uuid("Invalid report ID")
});

export const userReportsParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, "Invalid user ID")
});

export const getReportsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(["Post", "Comment", "Both"]).optional().default("Both"),
  status: z.string().optional(),
  fields: z.string().optional()
});

export const bulkDeleteReportsSchema = z.object({
  reportIds: z.array(z.string().uuid("Invalid report ID"))
});

export const updateContentStatusSchema = z.object({
  action: z.enum(["ban", "unban", "shadowBan", "shadowUnban"]),
  type: z.enum(["Post", "Comment"])
});

export const contentParamsSchema = z.object({
  targetId: z.string().regex(/^\d+$/, "Invalid target ID")
});

export const userParamsSchema = z.object({
  userId: z.string().uuid("Invalid user ID")
});

export const suspendUserSchema = z.object({
  ends: z.iso.datetime("Invalid end date"),
  reason: z.string().min(1, "Reason is required")
});

export const getUsersQuerySchema = z.object({
  email: z.email().optional(),
  username: z.string().min(1).optional()
}).refine(data => data.email || data.username, {
  message: "Either email or username must be provided"
});