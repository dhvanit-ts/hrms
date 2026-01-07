import { Request, Response } from "express";
import { z } from "zod";
import ApiResponse from "@/core/http/ApiResponse.js";
import { AttendanceCorrectionService } from "./attendance-correction.service.js";
import { AuthenticatedRequest } from "@/core/middlewares/auth.js";

// Validation schemas
const createRequestSchema = z.object({
  attendanceId: z.number().int().positive(),
  requestType: z.enum(["CHECK_IN_TIME", "CHECK_OUT_TIME", "BOTH_TIMES", "MISSING_CHECK_IN", "MISSING_CHECK_OUT"]),
  requestedCheckIn: z.iso.datetime().optional().transform(val => val ? new Date(val) : undefined),
  requestedCheckOut: z.iso.datetime().optional().transform(val => val ? new Date(val) : undefined),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason cannot exceed 500 characters"),
});

const reviewRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewerNotes: z.string().max(500, "Reviewer notes cannot exceed 500 characters").optional(),
});

const getRequestsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  employeeId: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional(),
});

export class AttendanceCorrectionController {
  /**
   * Create a new attendance correction request (Employee endpoint)
   */
  static async createRequest(req: AuthenticatedRequest, res: Response) {
    const employeeId = parseInt(req.user?.id as string);
    const validatedData = createRequestSchema.parse(req.body);

    const request = await AttendanceCorrectionService.createRequest(employeeId, validatedData);

    return ApiResponse.ok(res, {
      message: "Attendance correction request submitted successfully",
      data: request,
    });
  }

  /**
   * Get correction requests for the authenticated employee
   */
  static async getMyRequests(req: AuthenticatedRequest, res: Response) {
    const employeeId = parseInt(req.user?.id as string);
    const filters = getRequestsSchema.parse(req.query);

    const requests = await AttendanceCorrectionService.getEmployeeRequests(employeeId, filters);

    return ApiResponse.ok(res, {
      message: "Correction requests retrieved successfully",
      data: requests,
    });
  }

  /**
   * Get all correction requests (Admin endpoint)
   */
  static async getAllRequests(req: Request, res: Response) {
    const filters = getRequestsSchema.parse(req.query);

    const requests = await AttendanceCorrectionService.getAllRequests(filters);

    return ApiResponse.ok(res, {
      message: "All correction requests retrieved successfully",
      data: requests,
    });
  }

  /**
   * Get a specific correction request by ID
   */
  static async getRequestById(req: Request, res: Response) {
    const requestId = parseInt(req.params.id);

    const request = await AttendanceCorrectionService.getRequestById(requestId);

    return ApiResponse.ok(res, {
      message: "Correction request retrieved successfully",
      data: request,
    });
  }

  /**
   * Review a correction request (Admin endpoint)
   */
  static async reviewRequest(req: AuthenticatedRequest, res: Response) {
    const requestId = parseInt(req.params.id);
    const reviewerId = parseInt(req.user?.id as string);
    const validatedData = reviewRequestSchema.parse(req.body);

    const request = await AttendanceCorrectionService.reviewRequest(requestId, reviewerId, validatedData);

    return ApiResponse.ok(res, {
      message: `Correction request ${validatedData.status} successfully`,
      data: request,
    });
  }
}