import prisma from "@/config/db.js";
import ApiError from "@/core/http/ApiError.js";
import { writeAuditLog } from "@/infra/services/audit.service";
import publishEvent from "@/modules/notifications/event-bus.js";
import { handleEvent } from "@/modules/notifications/notification.orchestrator.js";
import { PublishDomainEvent } from "@/modules/notifications/notification.interface.js";

export interface CreateCorrectionRequestData {
  attendanceId: number;
  requestType: "CHECK_IN_TIME" | "CHECK_OUT_TIME" | "BOTH_TIMES" | "MISSING_CHECK_IN" | "MISSING_CHECK_OUT";
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
}

export interface ReviewCorrectionRequestData {
  status: "approved" | "rejected";
  reviewerNotes?: string;
}

export class AttendanceCorrectionService {
  /**
   * Create a new attendance correction request
   */
  static async createRequest(employeeId: number, data: CreateCorrectionRequestData) {
    // Validate attendance record exists and belongs to employee
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: data.attendanceId,
        employeeId: employeeId,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true }
        }
      }
    });

    if (!attendance) {
      throw new ApiError({
        statusCode: 404,
        code: "ATTENDANCE_NOT_FOUND",
        message: "Attendance record not found or does not belong to you",
      });
    }

    // Check if there's already a pending request for this attendance
    const existingRequest = await prisma.attendanceCorrectionRequest.findFirst({
      where: {
        attendanceId: data.attendanceId,
        status: "pending",
      },
    });

    if (existingRequest) {
      throw new ApiError({
        statusCode: 409,
        code: "PENDING_REQUEST_EXISTS",
        message: "There is already a pending correction request for this attendance record",
      });
    }

    // Validate request type and required fields
    this.validateCorrectionRequest(data, attendance);

    // Create the correction request
    const correctionRequest = await prisma.attendanceCorrectionRequest.create({
      data: {
        employeeId,
        attendanceId: data.attendanceId,
        requestType: data.requestType,
        requestedCheckIn: data.requestedCheckIn,
        requestedCheckOut: data.requestedCheckOut,
        currentCheckIn: attendance.checkIn,
        currentCheckOut: attendance.checkOut,
        reason: data.reason,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true }
        },
        attendance: {
          select: { id: true, date: true, checkIn: true, checkOut: true }
        }
      }
    });

    // Create notification event for admins
    const event: PublishDomainEvent = {
      type: "ATTENDANCE_CORRECTION_REQUESTED",
      actorId: employeeId,
      targetId: correctionRequest.id.toString(),
      targetType: "attendance_correction_request",
      createdAt: new Date(),
      metadata: {
        employeeId: employeeId,
        employeeName: attendance.employee.name,
        attendanceDate: attendance.date,
        requestType: data.requestType,
      }
    };

    const createdEvent = await publishEvent(event);
    await handleEvent({ ...createdEvent, metadata: createdEvent.metadata as Record<string, unknown> });

    await writeAuditLog({
      action: "CREATE_ATTENDANCE_CORRECTION_REQUEST",
      entity: "AttendanceCorrectionRequest",
      entityId: correctionRequest.id.toString(),
      performedBy: employeeId,
      metadata: {
        attendanceId: data.attendanceId,
        requestType: data.requestType,
        reason: data.reason,
      },
    });

    return correctionRequest;
  }

  /**
   * Get correction requests for an employee
   */
  static async getEmployeeRequests(employeeId: number, filters?: {
    status?: "pending" | "approved" | "rejected";
    limit?: number;
    offset?: number;
  }) {
    const where: any = { employeeId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where,
      include: {
        attendance: {
          select: { id: true, date: true, checkIn: true, checkOut: true }
        },
        reviewer: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return requests;
  }

  /**
   * Get all correction requests for admin review
   */
  static async getAllRequests(filters?: {
    status?: "pending" | "approved" | "rejected";
    employeeId?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, email: true }
        },
        attendance: {
          select: { id: true, date: true, checkIn: true, checkOut: true }
        },
        reviewer: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return requests;
  }

  /**
   * Review a correction request (approve/reject)
   */
  static async reviewRequest(
    requestId: number,
    reviewerId: number,
    data: ReviewCorrectionRequestData
  ) {
    // Get the correction request
    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true }
        },
        attendance: true
      }
    });

    if (!request) {
      throw new ApiError({
        statusCode: 404,
        code: "REQUEST_NOT_FOUND",
        message: "Correction request not found",
      });
    }

    if (request.status !== "pending") {
      throw new ApiError({
        statusCode: 409,
        code: "REQUEST_ALREADY_REVIEWED",
        message: "This request has already been reviewed",
      });
    }

    // Update the request status
    const updatedRequest = await prisma.attendanceCorrectionRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        reviewerId,
        reviewerNotes: data.reviewerNotes,
        reviewedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true }
        },
        attendance: true
      }
    });

    // If approved, update the attendance record
    if (data.status === "approved") {
      const updateData: any = {};

      if (request.requestedCheckIn) {
        updateData.checkIn = request.requestedCheckIn;
      }

      if (request.requestedCheckOut) {
        updateData.checkOut = request.requestedCheckOut;
      }

      // Recalculate duration if both times are present
      if (updateData.checkIn || updateData.checkOut) {
        const finalCheckIn = updateData.checkIn || request.attendance.checkIn;
        const finalCheckOut = updateData.checkOut || request.attendance.checkOut;

        if (finalCheckIn && finalCheckOut) {
          const duration = Math.floor(
            (finalCheckOut.getTime() - finalCheckIn.getTime()) / (1000 * 60)
          );
          updateData.duration = Math.max(0, duration);
        }
      }

      await prisma.attendance.update({
        where: { id: request.attendanceId },
        data: updateData,
      });

      await writeAuditLog({
        action: "APPROVE_ATTENDANCE_CORRECTION",
        entity: "Attendance",
        entityId: request.attendanceId.toString(),
        performedBy: reviewerId,
        metadata: {
          correctionRequestId: requestId,
          originalCheckIn: request.currentCheckIn,
          originalCheckOut: request.currentCheckOut,
          newCheckIn: request.requestedCheckIn,
          newCheckOut: request.requestedCheckOut,
        },
      });
    }

    // Create notification event for employee
    const eventType = data.status === "approved"
      ? "ATTENDANCE_CORRECTION_APPROVED"
      : "ATTENDANCE_CORRECTION_REJECTED";

    const reviewEvent: PublishDomainEvent = {
      type: eventType,
      actorId: reviewerId,
      targetId: requestId.toString(),
      targetType: "attendance_correction_request",
      createdAt: new Date(),
      metadata: {
        employeeId: request.employeeId,
        attendanceDate: request.attendance.date,
        requestType: request.requestType,
        reviewerNotes: data.reviewerNotes,
      }
    };

    const createdReviewEvent = await publishEvent(reviewEvent);
    await handleEvent({ ...createdReviewEvent, metadata: createdReviewEvent.metadata as Record<string, unknown> });

    await writeAuditLog({
      action: data.status === "approved" ? "APPROVE_ATTENDANCE_CORRECTION_REQUEST" : "REJECT_ATTENDANCE_CORRECTION_REQUEST",
      entity: "AttendanceCorrectionRequest",
      entityId: requestId.toString(),
      performedBy: reviewerId,
      metadata: {
        employeeId: request.employeeId,
        reviewerNotes: data.reviewerNotes,
      },
    });

    return updatedRequest;
  }

  /**
   * Get a specific correction request by ID
   */
  static async getRequestById(requestId: number) {
    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, email: true }
        },
        attendance: {
          select: { id: true, date: true, checkIn: true, checkOut: true }
        },
        reviewer: {
          select: { id: true, email: true }
        }
      }
    });

    if (!request) {
      throw new ApiError({
        statusCode: 404,
        code: "REQUEST_NOT_FOUND",
        message: "Correction request not found",
      });
    }

    return request;
  }

  /**
   * Validate correction request data
   */
  private static validateCorrectionRequest(data: CreateCorrectionRequestData, attendance: any) {
    switch (data.requestType) {
      case "CHECK_IN_TIME":
        if (!data.requestedCheckIn) {
          throw new ApiError({
            statusCode: 400,
            code: "MISSING_REQUESTED_CHECK_IN",
            message: "Requested check-in time is required for this correction type",
          });
        }
        if (!attendance.checkIn) {
          throw new ApiError({
            statusCode: 400,
            code: "NO_EXISTING_CHECK_IN",
            message: "Cannot correct check-in time when no check-in exists",
          });
        }
        break;

      case "CHECK_OUT_TIME":
        if (!data.requestedCheckOut) {
          throw new ApiError({
            statusCode: 400,
            code: "MISSING_REQUESTED_CHECK_OUT",
            message: "Requested check-out time is required for this correction type",
          });
        }
        if (!attendance.checkOut) {
          throw new ApiError({
            statusCode: 400,
            code: "NO_EXISTING_CHECK_OUT",
            message: "Cannot correct check-out time when no check-out exists",
          });
        }
        break;

      case "BOTH_TIMES":
        if (!data.requestedCheckIn || !data.requestedCheckOut) {
          throw new ApiError({
            statusCode: 400,
            code: "MISSING_REQUESTED_TIMES",
            message: "Both requested check-in and check-out times are required",
          });
        }
        break;

      case "MISSING_CHECK_IN":
        if (!data.requestedCheckIn) {
          throw new ApiError({
            statusCode: 400,
            code: "MISSING_REQUESTED_CHECK_IN",
            message: "Requested check-in time is required for missing check-in correction",
          });
        }
        if (attendance.checkIn) {
          throw new ApiError({
            statusCode: 400,
            code: "CHECK_IN_EXISTS",
            message: "Cannot add missing check-in when check-in already exists",
          });
        }
        break;

      case "MISSING_CHECK_OUT":
        if (!data.requestedCheckOut) {
          throw new ApiError({
            statusCode: 400,
            code: "MISSING_REQUESTED_CHECK_OUT",
            message: "Requested check-out time is required for missing check-out correction",
          });
        }
        if (attendance.checkOut) {
          throw new ApiError({
            statusCode: 400,
            code: "CHECK_OUT_EXISTS",
            message: "Cannot add missing check-out when check-out already exists",
          });
        }
        break;
    }

    // Validate that requested times are logical
    if (data.requestedCheckIn && data.requestedCheckOut) {
      if (data.requestedCheckIn >= data.requestedCheckOut) {
        throw new ApiError({
          statusCode: 400,
          code: "INVALID_TIME_RANGE",
          message: "Check-in time must be before check-out time",
        });
      }
    }
  }
}