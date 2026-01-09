import type { Request, Response } from "express";
import { z } from "zod";
import ApiResponse from "@/core/http/ApiResponse.js";
import type { AuthenticatedRequest, EmployeeAuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  CreateAttendanceCorrectionTicketSchema,
  CreateExtraLeaveTicketSchema,
  CreateProfileChangeTicketSchema,
  UpdateTicketStatusSchema,
  CreateTicketCommentSchema,
  TicketListQuerySchema,
} from "./ticket.dto.js";
import {
  createAttendanceCorrectionTicket,
  createExtraLeaveTicket,
  createProfileChangeTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addTicketComment,
  getTicketStatistics,
} from "./ticket.service.js";

// Employee Controllers

export async function createAttendanceCorrectionTicketController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const data = CreateAttendanceCorrectionTicketSchema.parse(req.body);

  const ticket = await createAttendanceCorrectionTicket(employeeId, data);

  return ApiResponse.ok(res, {
    message: "Attendance correction ticket created successfully",
    data: ticket,
  });
}

export async function createExtraLeaveTicketController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const data = CreateExtraLeaveTicketSchema.parse(req.body);

  const ticket = await createExtraLeaveTicket(employeeId, data);

  return ApiResponse.ok(res, {
    message: "Extra leave request ticket created successfully",
    data: ticket,
  });
}

export async function createProfileChangeTicketController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const data = CreateProfileChangeTicketSchema.parse(req.body);

  const ticket = await createProfileChangeTicket(employeeId, data);

  return ApiResponse.ok(res, {
    message: "Profile change request ticket created successfully",
    data: ticket,
  });
}

export async function getMyTicketsController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const query = TicketListQuerySchema.parse(req.query);

  const result = await getTickets(query, employeeId, 'employee');

  return ApiResponse.ok(res, {
    message: "Tickets retrieved successfully",
    data: result.tickets,
    meta: result.pagination,
  });
}

export async function getMyTicketByIdController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const ticketId = z.coerce.number().parse(req.params.id);

  const ticket = await getTicketById(ticketId, employeeId, 'employee');

  return ApiResponse.ok(res, {
    message: "Ticket retrieved successfully",
    data: ticket,
  });
}

export async function addMyTicketCommentController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;
  const ticketId = z.coerce.number().parse(req.params.id);
  const data = CreateTicketCommentSchema.parse(req.body);

  const comment = await addTicketComment(ticketId, employeeId, 'employee', data);

  return ApiResponse.ok(res, {
    message: "Comment added successfully",
    data: comment,
  });
}

export async function getMyTicketStatisticsController(
  req: EmployeeAuthenticatedRequest,
  res: Response
) {
  const employeeId = req.employee!.id;

  const statistics = await getTicketStatistics(employeeId);

  return ApiResponse.ok(res, {
    message: "Ticket statistics retrieved successfully",
    data: statistics,
  });
}

// Admin Controllers

export async function getAllTicketsController(
  req: AuthenticatedRequest,
  res: Response
) {
  const query = TicketListQuerySchema.parse(req.query);

  const result = await getTickets(query, undefined, 'admin');

  return ApiResponse.ok(res, {
    message: "All tickets retrieved successfully",
    data: result.tickets,
    meta: result.pagination,
  });
}

export async function getTicketByIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  const ticketId = z.coerce.number().parse(req.params.id);

  const ticket = await getTicketById(ticketId, undefined, 'admin');

  return ApiResponse.ok(res, {
    message: "Ticket retrieved successfully",
    data: ticket,
  });
}

export async function updateTicketStatusController(
  req: AuthenticatedRequest,
  res: Response
) {
  const ticketId = z.coerce.number().parse(req.params.id);
  const approverId = parseInt(req.user!.id); // Admin/Manager ID
  const data = UpdateTicketStatusSchema.parse(req.body);

  const ticket = await updateTicketStatus(ticketId, approverId, data);

  return ApiResponse.ok(res, {
    message: `Ticket ${data.status} successfully`,
    data: ticket,
  });
}

export async function addTicketCommentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const ticketId = z.coerce.number().parse(req.params.id);
  const authorId = parseInt(req.user!.id);
  const data = CreateTicketCommentSchema.parse(req.body);

  const comment = await addTicketComment(ticketId, authorId, 'user', data);

  return ApiResponse.ok(res, {
    message: "Comment added successfully",
    data: comment,
  });
}

export async function getTicketStatisticsController(
  req: AuthenticatedRequest,
  res: Response
) {
  const employeeId = req.query.employeeId ? z.coerce.number().parse(req.query.employeeId) : undefined;

  const statistics = await getTicketStatistics(employeeId);

  return ApiResponse.ok(res, {
    message: "Ticket statistics retrieved successfully",
    data: statistics,
  });
}

// Shared Controllers (for endpoints accessible by both employees and admins)

export async function getTicketCategoriesController(
  req: Request,
  res: Response
) {
  const categories = {
    attendance_correction: [
      { value: "late_checkin", label: "Late Check-in" },
      { value: "early_checkout", label: "Early Check-out" },
      { value: "missing_checkin", label: "Missing Check-in" },
      { value: "missing_checkout", label: "Missing Check-out" },
      { value: "wrong_attendance_type", label: "Wrong Attendance Type" },
    ],
    extra_leave_request: [
      { value: "emergency_leave", label: "Emergency Leave" },
      { value: "extended_leave", label: "Extended Leave" },
      { value: "unpaid_leave", label: "Unpaid Leave" },
    ],
    profile_change_request: [
      { value: "personal_info", label: "Personal Information" },
      { value: "employment_details", label: "Employment Details" },
      { value: "shift_change", label: "Shift Change" },
      { value: "department_transfer", label: "Department Transfer" },
      { value: "job_role_change", label: "Job Role Change" },
      { value: "salary_adjustment", label: "Salary Adjustment" },
      { value: "contact_details", label: "Contact Details" },
    ],
  };

  return ApiResponse.ok(res, {
    message: "Ticket categories retrieved successfully",
    data: categories,
  });
}