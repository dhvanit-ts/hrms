import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";
import ApiError from "@/core/http/ApiError.js";
import { logger } from "@/config/logger";
import publishEvent from "../notifications/event-bus";
import mailService from "@/infra/services/mail";
import type {
  CreateAttendanceCorrectionTicket,
  CreateExtraLeaveTicket,
  CreateProfileChangeTicket,
  UpdateTicketStatus,
  CreateTicketComment,
  TicketListQuery,
  TicketType,
  TicketStatus
} from "./ticket.dto";

// Generate unique ticket number
async function generateTicketNumber(): Promise<string> {
  const count = await prisma.ticket.count();
  return `TKT-${String(count + 1).padStart(4, '0')}`;
}

// Validate attendance correction request
async function validateAttendanceCorrection(
  employeeId: number,
  data: CreateAttendanceCorrectionTicket
): Promise<void> {
  const requestedDate = new Date(data.requestedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if date is not too far in the past (e.g., max 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (requestedDate < thirtyDaysAgo) {
    throw new ApiError({
      statusCode: 400,
      code: "DATE_TOO_OLD",
      message: "Cannot request correction for dates older than 30 days",
    });
  }

  // Check if date is not in the future
  if (requestedDate > today) {
    throw new ApiError({
      statusCode: 400,
      code: "FUTURE_DATE",
      message: "Cannot request correction for future dates",
    });
  }

  // If attendanceId is provided, verify it exists and belongs to employee
  if (data.attendanceId) {
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: data.attendanceId,
        employeeId: employeeId,
      },
    });

    if (!attendance) {
      throw new ApiError({
        statusCode: 404,
        code: "ATTENDANCE_NOT_FOUND",
        message: "Attendance record not found or does not belong to you",
      });
    }
  }

  // Check for existing pending tickets for the same date
  const existingTicket = await prisma.ticket.findFirst({
    where: {
      employeeId: employeeId,
      type: "attendance_correction",
      requestedDate: requestedDate,
      status: {
        in: ["pending", "under_review"],
      },
    },
  });

  if (existingTicket) {
    throw new ApiError({
      statusCode: 409,
      code: "DUPLICATE_REQUEST",
      message: "You already have a pending attendance correction request for this date",
    });
  }
}

// Validate extra leave request
async function validateExtraLeaveRequest(
  employeeId: number,
  data: CreateExtraLeaveTicket
): Promise<void> {
  const startDate = new Date(data.leaveStartDate);
  const endDate = new Date(data.leaveEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check date validity
  if (endDate < startDate) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_DATE_RANGE",
      message: "End date cannot be before start date",
    });
  }

  // Check for overlapping leave requests or tickets
  const overlappingLeave = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: employeeId,
      OR: [
        {
          startDate: { gte: startDate, lte: endDate },
        },
        {
          endDate: { gte: startDate, lte: endDate },
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ],
      status: {
        in: ["pending", "approved"],
      },
    },
  });

  if (overlappingLeave) {
    throw new ApiError({
      statusCode: 409,
      code: "OVERLAPPING_LEAVE",
      message: "You have an overlapping leave request for this period",
    });
  }

  // Check for overlapping extra leave tickets
  const overlappingTicket = await prisma.ticket.findFirst({
    where: {
      employeeId: employeeId,
      type: "extra_leave_request",
      status: {
        in: ["pending", "under_review", "approved"],
      },
      OR: [
        {
          leaveStartDate: { gte: startDate, lte: endDate },
        },
        {
          leaveEndDate: { gte: startDate, lte: endDate },
        },
        {
          AND: [
            { leaveStartDate: { lte: startDate } },
            { leaveEndDate: { gte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlappingTicket) {
    throw new ApiError({
      statusCode: 409,
      code: "OVERLAPPING_EXTRA_LEAVE",
      message: "You have an overlapping extra leave request for this period",
    });
  }
}

// Validate profile change request
async function validateProfileChangeRequest(
  employeeId: number,
  data: CreateProfileChangeTicket
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new ApiError({
      statusCode: 404,
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee not found",
    });
  }

  // Validate that requested changes are allowed for the category
  const allowedFields: Record<string, string[]> = {
    personal_info: ["name", "phone", "dateOfBirth"],
    employment_details: ["hireDate", "status"],
    shift_change: ["shiftId"],
    department_transfer: ["departmentId"],
    job_role_change: ["jobRoleId"],
    salary_adjustment: ["salary"],
    contact_details: ["phone", "email"],
  };

  const categoryFields = allowedFields[data.category];
  const requestedFields = Object.keys(data.profileChanges);

  const invalidFields = requestedFields.filter(field => !categoryFields.includes(field));
  if (invalidFields.length > 0) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_FIELDS",
      message: `Invalid fields for category ${data.category}: ${invalidFields.join(", ")}`,
    });
  }

  // Check for existing pending profile change tickets
  const existingTicket = await prisma.ticket.findFirst({
    where: {
      employeeId: employeeId,
      type: "profile_change_request",
      category: data.category,
      status: {
        in: ["pending", "under_review"],
      },
    },
  });

  if (existingTicket) {
    throw new ApiError({
      statusCode: 409,
      code: "DUPLICATE_REQUEST",
      message: `You already have a pending ${data.category.replace("_", " ")} request`,
    });
  }
}

// Create attendance correction ticket
export async function createAttendanceCorrectionTicket(
  employeeId: number,
  data: CreateAttendanceCorrectionTicket
) {
  await validateAttendanceCorrection(employeeId, data);

  const ticketNumber = await generateTicketNumber();
  const requestedDate = new Date(data.requestedDate);

  // Calculate leave days if it's a date range
  let leaveDays = null;
  if (data.requestedCheckIn && data.requestedCheckOut) {
    const checkIn = new Date(`${data.requestedDate}T${data.requestedCheckIn}`);
    const checkOut = new Date(`${data.requestedDate}T${data.requestedCheckOut}`);
    leaveDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      employeeId,
      type: "attendance_correction",
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority,
      attendanceId: data.attendanceId,
      requestedDate,
      requestedCheckIn: data.requestedCheckIn ? new Date(`${data.requestedDate}T${data.requestedCheckIn}`) : null,
      requestedCheckOut: data.requestedCheckOut ? new Date(`${data.requestedDate}T${data.requestedCheckOut}`) : null,
      attachments: data.attachments,
    },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
      attendance: true,
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "CREATE_ATTENDANCE_CORRECTION_TICKET",
    entity: "ticket",
    entityId: ticket.id.toString(),
    performedBy: employeeId,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      category: data.category,
      requestedDate: data.requestedDate,
    },
  });

  // Publish event for notifications
  await publishEvent({
    type: "TICKET_CREATED",
    actorId: employeeId,
    targetId: ticket.id.toString(),
    targetType: "ticket",
    metadata: {
      ticketType: "attendance_correction",
      ticketNumber: ticket.ticketNumber,
      employeeName: ticket.employee.name,
      category: data.category,
    },
    createdAt: new Date
  });

  logger.info(`Attendance correction ticket created: ${ticket.ticketNumber} by employee ${employeeId}`);

  return ticket;
}

// Create extra leave request ticket
export async function createExtraLeaveTicket(
  employeeId: number,
  data: CreateExtraLeaveTicket
) {
  await validateExtraLeaveRequest(employeeId, data);

  const ticketNumber = await generateTicketNumber();
  const startDate = new Date(data.leaveStartDate);
  const endDate = new Date(data.leaveEndDate);

  // Calculate leave days
  const leaveDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      employeeId,
      type: "extra_leave_request",
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority,
      leaveType: data.leaveType,
      leaveStartDate: startDate,
      leaveEndDate: endDate,
      leaveDays,
      attachments: data.attachments,
    },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "CREATE_EXTRA_LEAVE_TICKET",
    entity: "ticket",
    entityId: ticket.id.toString(),
    performedBy: employeeId,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      category: data.category,
      leaveType: data.leaveType,
      leaveDays,
    },
  });

  // Publish event for notifications
  await publishEvent({
    type: "TICKET_CREATED",
    actorId: employeeId,
    targetId: ticket.id.toString(),
    targetType: "ticket",
    metadata: {
      ticketType: "extra_leave_request",
      ticketNumber: ticket.ticketNumber,
      employeeName: ticket.employee.name,
      category: data.category,
      leaveDays,
    },
    createdAt: new Date
  });

  logger.info(`Extra leave ticket created: ${ticket.ticketNumber} by employee ${employeeId}`);

  return ticket;
}

// Create profile change request ticket
export async function createProfileChangeTicket(
  employeeId: number,
  data: CreateProfileChangeTicket
) {
  await validateProfileChangeRequest(employeeId, data);

  const ticketNumber = await generateTicketNumber();

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      employeeId,
      type: "profile_change_request",
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority,
      profileChanges: data.profileChanges,
      attachments: data.attachments,
    },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "CREATE_PROFILE_CHANGE_TICKET",
    entity: "ticket",
    entityId: ticket.id.toString(),
    performedBy: employeeId,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      category: data.category,
      profileChanges: data.profileChanges,
    },
  });

  // Publish event for notifications
  await publishEvent({
    type: "TICKET_CREATED",
    actorId: employeeId,
    targetId: ticket.id.toString(),
    targetType: "ticket",
    metadata: {
      ticketType: "profile_change_request",
      ticketNumber: ticket.ticketNumber,
      employeeName: ticket.employee.name,
      category: data.category,
      changedFields: Object.keys(data.profileChanges),
    },
    createdAt: new Date
  });

  logger.info(`Profile change ticket created: ${ticket.ticketNumber} by employee ${employeeId}`);

  return ticket;
}

// Get tickets with filtering and pagination
export async function getTickets(query: TicketListQuery, requesterId?: number, requesterType?: 'employee' | 'admin') {
  const {
    page,
    limit,
    status,
    type,
    category,
    priority,
    employeeId,
    startDate,
    endDate,
    search,
  } = query;

  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // If requester is an employee, only show their tickets
  if (requesterType === 'employee' && requesterId) {
    where.employeeId = requesterId;
  }

  // If specific employee is requested (admin view)
  if (employeeId && requesterType === 'admin') {
    where.employeeId = employeeId;
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (category) where.category = category;
  if (priority) where.priority = priority;

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Search filter
  if (search) {
    where.OR = [
      { ticketNumber: { contains: search } },
      { title: { contains: search } },
      { description: { contains: search } },
      { employee: { name: { contains: search } } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
          },
        },
        approver: true,
        attendance: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Latest 3 comments for preview
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get single ticket by ID
export async function getTicketById(ticketId: number, requesterId?: number, requesterType?: 'employee' | 'admin') {
  const where: any = { id: ticketId };

  // If requester is an employee, only allow access to their own tickets
  if (requesterType === 'employee' && requesterId) {
    where.employeeId = requesterId;
  }

  const ticket = await prisma.ticket.findFirst({
    where,
    include: {
      employee: {
        include: {
          department: true,
          jobRole: true,
          shift: true,
        },
      },
      approver: true,
      attendance: true,
      comments: {
        include: {
          // We'll need to handle author details based on authorType
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    throw new ApiError({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
      message: "Ticket not found or access denied",
    });
  }

  return ticket;
}

// Update ticket status (approve/reject/etc.)
export async function updateTicketStatus(
  ticketId: number,
  approverId: number,
  data: UpdateTicketStatus
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      employee: true,
    },
  });

  if (!ticket) {
    throw new ApiError({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
      message: "Ticket not found",
    });
  }

  // Check if ticket is in a state that can be updated
  if (ticket.status === "approved" || ticket.status === "rejected") {
    throw new ApiError({
      statusCode: 409,
      code: "TICKET_ALREADY_PROCESSED",
      message: "Ticket has already been processed",
    });
  }

  const updateData: any = {
    status: data.status,
    approverId,
    approverNotes: data.approverNotes,
  };

  if (data.status === "approved") {
    updateData.approvedAt = new Date();
  } else if (data.status === "rejected") {
    updateData.rejectedAt = new Date();
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      employee: {
        include: {
          department: true,
        },
      },
      approver: true,
    },
  });

  // If approved, apply the changes
  if (data.status === "approved") {
    await applyTicketChanges(updatedTicket);
  }

  // Write audit log
  await writeAuditLog({
    action: `TICKET_${data.status.toUpperCase()}`,
    entity: "ticket",
    entityId: ticketId.toString(),
    performedBy: approverId,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      previousStatus: ticket.status,
      newStatus: data.status,
      approverNotes: data.approverNotes,
    },
  });

  // Publish event for notifications
  await publishEvent({
    type: `TICKET_${data.status.toUpperCase()}`,
    actorId: approverId,
    targetId: ticketId.toString(),
    targetType: "ticket",
    metadata: {
      ticketNumber: ticket.ticketNumber,
      employeeId: ticket.employeeId,
      employeeName: ticket.employee.name,
      ticketType: ticket.type,
    },
    createdAt: new Date
  });

  logger.info(`Ticket ${ticket.ticketNumber} ${data.status} by approver ${approverId}`);

  // Send email notification to employee
  if (data.status === "approved" || data.status === "rejected") {
    try {
      const approver = await prisma.employee.findUnique({
        where: { id: approverId },
        select: { name: true },
      });

      const emailType = data.status === "approved" ? "TICKET-APPROVED" : "TICKET-REJECTED";

      await mailService.send(
        updatedTicket.employee.email,
        emailType,
        {
          employeeName: updatedTicket.employee.name,
          ticketNumber: updatedTicket.ticketNumber,
          ticketType: updatedTicket.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          ticketTitle: updatedTicket.title,
          approverName: approver?.name || "Manager",
          approverNotes: data.approverNotes,
          dashboardUrl: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/employee/tickets` : undefined,
        }
      );

      logger.info(`${emailType} email sent to ${updatedTicket.employee.email} for ticket ${ticket.ticketNumber}`);
    } catch (emailError) {
      logger.error(`Failed to send ${data.status} email for ticket ${ticket.ticketNumber}:`, emailError);
      // Don't throw error - email failure shouldn't break the ticket update
    }
  }

  return updatedTicket;
}

// Apply approved ticket changes
async function applyTicketChanges(ticket: any) {
  try {
    switch (ticket.type) {
      case "attendance_correction":
        await applyAttendanceCorrection(ticket);
        break;
      case "extra_leave_request":
        await applyExtraLeaveRequest(ticket);
        break;
      case "profile_change_request":
        await applyProfileChanges(ticket);
        break;
    }
  } catch (error) {
    logger.error(`Failed to apply changes for ticket ${ticket.ticketNumber}:`, error);
    // You might want to update ticket status to indicate application failure
    throw error;
  }
}

// Apply attendance correction
async function applyAttendanceCorrection(ticket: any) {
  const { attendanceId, requestedDate, requestedCheckIn, requestedCheckOut, employeeId } = ticket;

  if (attendanceId) {
    // Update existing attendance record
    const updateData: any = {};
    if (requestedCheckIn) updateData.checkIn = requestedCheckIn;
    if (requestedCheckOut) updateData.checkOut = requestedCheckOut;

    // Recalculate duration if both times are provided
    if (requestedCheckIn && requestedCheckOut) {
      const duration = Math.floor((new Date(requestedCheckOut).getTime() - new Date(requestedCheckIn).getTime()) / (1000 * 60));
      updateData.duration = duration;
    }

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: updateData,
    });
  } else {
    // Create new attendance record
    const attendanceData: any = {
      employeeId,
      date: requestedDate,
    };

    if (requestedCheckIn) attendanceData.checkIn = requestedCheckIn;
    if (requestedCheckOut) attendanceData.checkOut = requestedCheckOut;

    // Calculate duration if both times are provided
    if (requestedCheckIn && requestedCheckOut) {
      const duration = Math.floor((new Date(requestedCheckOut).getTime() - new Date(requestedCheckIn).getTime()) / (1000 * 60));
      attendanceData.duration = duration;
    }

    await prisma.attendance.create({
      data: attendanceData,
    });
  }

  logger.info(`Applied attendance correction for ticket ${ticket.ticketNumber}`);
}

// Apply extra leave request
async function applyExtraLeaveRequest(ticket: any) {
  const { employeeId, leaveType, leaveStartDate, leaveEndDate, leaveDays } = ticket;

  // Create leave request
  await prisma.leaveRequest.create({
    data: {
      employeeId,
      type: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      status: "approved", // Already approved via ticket
      approverId: ticket.approverId,
      reason: `Extra leave approved via ticket ${ticket.ticketNumber}`,
    },
  });

  logger.info(`Applied extra leave request for ticket ${ticket.ticketNumber}`);
}

// Apply profile changes
async function applyProfileChanges(ticket: any) {
  const { employeeId, profileChanges } = ticket;

  // Update employee record with the approved changes
  await prisma.employee.update({
    where: { id: employeeId },
    data: profileChanges,
  });

  logger.info(`Applied profile changes for ticket ${ticket.ticketNumber}:`, profileChanges);
}

// Add comment to ticket
export async function addTicketComment(
  ticketId: number,
  authorId: number,
  authorType: 'employee' | 'user',
  data: CreateTicketComment
) {
  // Verify ticket exists and user has access
  const ticket = await getTicketById(ticketId, authorType === 'employee' ? authorId : undefined, authorType === 'employee' ? 'employee' : 'admin');

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId,
      authorType,
      content: data.content,
      isInternal: data.isInternal,
    },
  });

  // Write audit log
  await writeAuditLog({
    action: "ADD_TICKET_COMMENT",
    entity: "ticket_comment",
    entityId: comment.id.toString(),
    performedBy: authorId,
    metadata: {
      ticketId,
      ticketNumber: ticket.ticketNumber,
      isInternal: data.isInternal,
    },
  });

  logger.info(`Comment added to ticket ${ticket.ticketNumber} by ${authorType} ${authorId}`);

  return comment;
}

// Get ticket statistics
export async function getTicketStatistics(employeeId?: number) {
  try {
    const where: any = {};

    // Only add employeeId filter if it's a valid number
    if (employeeId && !isNaN(employeeId) && employeeId > 0) {
      where.employeeId = employeeId;
    }

    // Get basic counts first
    const [
      totalTickets,
      pendingTickets,
      underReviewTickets,
      approvedTickets,
      rejectedTickets,
      cancelledTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: "pending" } }),
      prisma.ticket.count({ where: { ...where, status: "under_review" } }),
      prisma.ticket.count({ where: { ...where, status: "approved" } }),
      prisma.ticket.count({ where: { ...where, status: "rejected" } }),
      prisma.ticket.count({ where: { ...where, status: "cancelled" } }),
    ]);

    // Get type counts
    const [
      attendanceTickets,
      leaveTickets,
      profileTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { ...where, type: "attendance_correction" } }),
      prisma.ticket.count({ where: { ...where, type: "extra_leave_request" } }),
      prisma.ticket.count({ where: { ...where, type: "profile_change_request" } }),
    ]);

    // Get priority counts
    const [
      urgentTickets,
      highTickets,
      mediumTickets,
      lowTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { ...where, priority: "urgent" } }),
      prisma.ticket.count({ where: { ...where, priority: "high" } }),
      prisma.ticket.count({ where: { ...where, priority: "medium" } }),
      prisma.ticket.count({ where: { ...where, priority: "low" } }),
    ]);

    // Get category counts (simplified - only get actual categories that exist)
    const categoryResults = await prisma.ticket.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true,
      },
    });

    // Convert category results to object
    const byCategory: Record<string, number> = {};
    categoryResults.forEach(result => {
      if (result.category) {
        byCategory[result.category] = result._count.category;
      }
    });

    return {
      total: totalTickets || 0,
      pending: pendingTickets || 0,
      underReview: underReviewTickets || 0,
      approved: approvedTickets || 0,
      rejected: rejectedTickets || 0,
      cancelled: cancelledTickets || 0,
      byType: {
        attendance_correction: attendanceTickets || 0,
        extra_leave_request: leaveTickets || 0,
        profile_change_request: profileTickets || 0,
      },
      byCategory,
      byPriority: {
        urgent: urgentTickets || 0,
        high: highTickets || 0,
        medium: mediumTickets || 0,
        low: lowTickets || 0,
      },
    };
  } catch (error) {
    console.error('Error in getTicketStatistics:', error);
    // Return default statistics on error
    return {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      byType: {
        attendance_correction: 0,
        extra_leave_request: 0,
        profile_change_request: 0,
      },
      byCategory: {},
      byPriority: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
}