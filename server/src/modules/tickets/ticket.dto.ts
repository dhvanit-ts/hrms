import { z } from "zod";

// Ticket Type and Category Enums
export const TicketTypeSchema = z.enum([
  "attendance_correction",
  "extra_leave_request",
  "profile_change_request"
]);

export const TicketCategorySchema = z.enum([
  // Attendance categories
  "late_checkin",
  "early_checkout",
  "missing_checkin",
  "missing_checkout",
  "wrong_attendance_type",
  // Leave categories
  "emergency_leave",
  "extended_leave",
  "unpaid_leave",
  // Profile change categories
  "personal_info",
  "employment_details",
  "shift_change",
  "department_transfer",
  "job_role_change",
  "salary_adjustment",
  "contact_details"
]);

export const TicketStatusSchema = z.enum([
  "pending",
  "under_review",
  "approved",
  "rejected",
  "cancelled"
]);

export const PrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

// Base Ticket Schema
export const TicketBaseSchema = z.object({
  id: z.number(),
  ticketNumber: z.string(),
  employeeId: z.number(),
  type: TicketTypeSchema,
  category: TicketCategorySchema,
  title: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  status: TicketStatusSchema,
  approverId: z.number().nullable(),
  approverNotes: z.string().nullable(),
  attendanceId: z.number().nullable(),
  requestedDate: z.string().nullable(),
  requestedCheckIn: z.string().nullable(),
  requestedCheckOut: z.string().nullable(),
  leaveType: z.string().nullable(),
  leaveStartDate: z.string().nullable(),
  leaveEndDate: z.string().nullable(),
  leaveDays: z.number().nullable(),
  profileChanges: z.any().nullable(),
  metadata: z.any().nullable(),
  attachments: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedAt: z.string().nullable(),
  rejectedAt: z.string().nullable(),
});

// Create Attendance Correction Ticket Schema
export const CreateAttendanceCorrectionTicketSchema = z.object({
  attendanceId: z.number().optional(),
  requestedDate: z.string(),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
  category: z.enum(["late_checkin", "early_checkout", "missing_checkin", "missing_checkout", "wrong_attendance_type"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: PrioritySchema.default("medium"),
  attachments: z.array(z.string()).default([]),
});

// Create Extra Leave Request Ticket Schema  
export const CreateExtraLeaveTicketSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  leaveStartDate: z.string(),
  leaveEndDate: z.string(),
  category: z.enum(["emergency_leave", "extended_leave", "unpaid_leave"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: PrioritySchema.default("medium"),
  attachments: z.array(z.string()).default([]),
});

// Create Profile Change Request Ticket Schema
export const CreateProfileChangeTicketSchema = z.object({
  category: z.enum(["personal_info", "employment_details", "shift_change", "department_transfer", "job_role_change", "salary_adjustment", "contact_details"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  profileChanges: z.record(z.string(), z.any()),
  priority: PrioritySchema.default("medium"),
  attachments: z.array(z.string()).default([]),
});

// Update Ticket Status Schema
export const UpdateTicketStatusSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected", "cancelled"]),
  approverNotes: z.string().optional(),
});

// Ticket Comment Schema
export const TicketCommentSchema = z.object({
  id: z.number(),
  ticketId: z.number(),
  authorId: z.number(),
  authorType: z.enum(["employee", "user"]),
  content: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateTicketCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  isInternal: z.boolean().default(false),
});

// Ticket with Relations Schema
export const TicketWithRelationsSchema = TicketBaseSchema.extend({
  employee: z.object({
    id: z.number(),
    employeeId: z.string(),
    name: z.string(),
    email: z.string(),
    department: z.object({
      id: z.number(),
      name: z.string(),
    }).nullable(),
  }),
  approver: z.object({
    id: z.number(),
    employeeId: z.string(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  attendance: z.object({
    id: z.number(),
    date: z.string(),
    checkIn: z.string().nullable(),
    checkOut: z.string().nullable(),
    type: z.string().nullable(),
  }).nullable(),
  comments: z.array(TicketCommentSchema).default([]),
});

// Ticket List Query Schema
export const TicketListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: TicketStatusSchema.optional(),
  type: TicketTypeSchema.optional(),
  category: TicketCategorySchema.optional(),
  priority: PrioritySchema.optional(),
  employeeId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

// Type exports
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type CreateAttendanceCorrectionTicket = z.infer<typeof CreateAttendanceCorrectionTicketSchema>;
export type CreateExtraLeaveTicket = z.infer<typeof CreateExtraLeaveTicketSchema>;
export type CreateProfileChangeTicket = z.infer<typeof CreateProfileChangeTicketSchema>;
export type UpdateTicketStatus = z.infer<typeof UpdateTicketStatusSchema>;
export type CreateTicketComment = z.infer<typeof CreateTicketCommentSchema>;
export type TicketWithRelations = z.infer<typeof TicketWithRelationsSchema>;
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;