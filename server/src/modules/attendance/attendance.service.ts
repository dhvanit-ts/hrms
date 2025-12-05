import { writeAuditLog } from "@/infra/services/audit.service";
import prisma from "@/config/db.js";
import { ipValidationService } from "@/infra/services/ip-validation.service";
import ApiError from "@/core/http/ApiError.js";

export async function checkIn(employeeId: string, ipAddress: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  // Check for existing active session before creating record
  const existing = await prisma.attendance.findFirst({
    where: { employeeId: eid, date: day },
  });

  if (existing?.checkIn) {
    throw new ApiError({
      statusCode: 409,
      code: "DUPLICATE_PUNCH_IN",
      message: "Already checked in today. Please check out before punching in again.",
    });
  }

  // Use IP validation service to determine attendance type
  const attendanceType = ipValidationService.getAttendanceType(ipAddress);

  const record = existing
    ? await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkIn: new Date(),
        type: attendanceType,
        ipAddress: ipAddress,
      },
    })
    : await prisma.attendance.create({
      data: {
        employeeId: eid,
        date: day,
        checkIn: new Date(),
        type: attendanceType,
        ipAddress: ipAddress,
      },
    });

  await writeAuditLog({
    action: "CHECK_IN",
    entity: "Attendance",
    entityId: record.id.toString(),
    performedBy: employeeId,
  });

  return record;
}

export async function checkOut(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  // Verify active session exists before updating
  const item = await prisma.attendance.findFirst({
    where: { employeeId: eid, date: day },
  });

  if (!item?.checkIn) {
    throw new ApiError({
      statusCode: 409,
      code: "NO_ACTIVE_SESSION",
      message: "No active punch session found. Please punch in first.",
    });
  }
  if (item.checkOut) {
    throw new ApiError({
      statusCode: 409,
      code: "ALREADY_CHECKED_OUT",
      message: "Already checked out for today.",
    });
  }

  const checkOutTime = new Date();

  // Calculate duration in minutes
  const duration = Math.floor(
    (checkOutTime.getTime() - item.checkIn.getTime()) / (1000 * 60)
  );

  // Update record with punch-out timestamp and duration
  const updated = await prisma.attendance.update({
    where: { id: item.id },
    data: {
      checkOut: checkOutTime,
      duration: Math.max(0, duration),
    },
  });

  await writeAuditLog({
    action: "CHECK_OUT",
    entity: "Attendance",
    entityId: updated.id.toString(),
    performedBy: employeeId,
  });

  return updated;
}

export async function dailySummary(date: string) {
  const d = new Date(date);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const next = new Date(day);
  next.setDate(day.getDate() + 1);

  const items = await prisma.attendance.findMany({
    where: {
      date: {
        gte: day,
        lt: next,
      },
    },
  });

  return items;
}

/**
 * Get attendance history with date range filtering
 * Records are ordered by date descending
 */
export async function getAttendanceHistory(
  employeeId: string,
  filters?: { startDate?: string; endDate?: string }
) {
  const eid = parseInt(employeeId);

  const whereClause: any = {
    employeeId: eid,
  };

  // Add date range filtering if provided
  if (filters?.startDate || filters?.endDate) {
    whereClause.date = {};

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      whereClause.date.gte = startDay;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      // Include the entire end date
      const nextDay = new Date(endDay);
      nextDay.setDate(endDay.getDate() + 1);
      whereClause.date.lt = nextDay;
    }
  }

  // Ensure records are ordered by date descending
  const records = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      breaks: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  return records;
}

/**
 * Get today's attendance status to check for active sessions
 */
export async function getTodayStatus(employeeId: string) {
  const eid = parseInt(employeeId);
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: eid,
      date: day,
    },
    include: {
      breaks: true,
    },
  });

  return {
    hasActiveSession: !!(attendance?.checkIn && !attendance?.checkOut),
    attendance: attendance || null,
  };
}

/**
 * Start a break for the current attendance session
 */
export async function startBreak(employeeId: string) {
  const eid = parseInt(employeeId);
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Find today's attendance record
  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: eid,
      date: day,
    },
    include: {
      breaks: true,
    },
  });

  if (!attendance?.checkIn) {
    throw new ApiError({
      statusCode: 409,
      code: "NO_ACTIVE_SESSION",
      message: "No active punch session found. Please punch in first.",
    });
  }

  if (attendance.checkOut) {
    throw new ApiError({
      statusCode: 409,
      code: "SESSION_ENDED",
      message: "Cannot start break after checking out.",
    });
  }

  // Check if there's already an active break
  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (activeBreak) {
    throw new ApiError({
      statusCode: 409,
      code: "BREAK_ALREADY_ACTIVE",
      message: "A break is already in progress. Please end it first.",
    });
  }

  // Create new break
  const breakRecord = await prisma.break.create({
    data: {
      attendanceId: attendance.id,
      startTime: new Date(),
    },
  });

  await writeAuditLog({
    action: "START_BREAK",
    entity: "Break",
    entityId: breakRecord.id.toString(),
    performedBy: employeeId,
  });

  return breakRecord;
}

/**
 * End the current active break
 */
export async function endBreak(employeeId: string) {
  const eid = parseInt(employeeId);
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Find today's attendance record with breaks
  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: eid,
      date: day,
    },
    include: {
      breaks: true,
    },
  });

  if (!attendance) {
    throw new ApiError({
      statusCode: 404,
      code: "NO_ATTENDANCE_RECORD",
      message: "No attendance record found for today.",
    });
  }

  // Find active break
  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (!activeBreak) {
    throw new ApiError({
      statusCode: 409,
      code: "NO_ACTIVE_BREAK",
      message: "No active break found to end.",
    });
  }

  const endTime = new Date();
  const duration = Math.floor(
    (endTime.getTime() - activeBreak.startTime.getTime()) / (1000 * 60)
  );

  // Update break with end time and duration
  const updatedBreak = await prisma.break.update({
    where: { id: activeBreak.id },
    data: {
      endTime,
      duration: Math.max(0, duration),
    },
  });

  await writeAuditLog({
    action: "END_BREAK",
    entity: "Break",
    entityId: updatedBreak.id.toString(),
    performedBy: employeeId,
  });

  return updatedBreak;
}

/**
 * Get break status for today
 */
export async function getBreakStatus(employeeId: string) {
  const eid = parseInt(employeeId);
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: eid,
      date: day,
    },
    include: {
      breaks: {
        orderBy: {
          startTime: 'desc',
        },
      },
    },
  });

  if (!attendance) {
    return {
      hasActiveBreak: false,
      breaks: [],
      totalBreakTime: 0,
    };
  }

  const activeBreak = attendance.breaks.find(b => !b.endTime);
  const totalBreakTime = attendance.breaks
    .filter(b => b.duration)
    .reduce((sum, b) => sum + (b.duration || 0), 0);

  return {
    hasActiveBreak: !!activeBreak,
    activeBreak: activeBreak || null,
    breaks: attendance.breaks,
    totalBreakTime,
  };
}
