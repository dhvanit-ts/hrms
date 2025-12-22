import { writeAuditLog } from "@/infra/services/audit.service";
import prisma from "@/config/db.js";
import { ipValidationService } from "@/infra/services/ip-validation.service";
import ApiError from "@/core/http/ApiError.js";
import { AttendanceValidationService } from "./attendance-validation.service.js";

export async function checkIn(employeeId: string, ipAddress: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  await AttendanceValidationService.validateEmployeeAttendanceEligibility(eid, day);

  const employee = await prisma.employee.findUnique({
    where: { id: eid },
    include: { shift: true },
  });

  if (!employee) {
    throw new ApiError({
      statusCode: 404,
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee not found",
    });
  }

  const existing = await prisma.attendance.findFirst({
    where: { employeeId: eid, date: day },
  });

  if (existing?.checkIn) {
    const code = existing.checkOut ? "DUPLICATE_ATTENDANCE" : "DUPLICATE_PUNCH_IN"
    const message = existing.checkOut ? "Your attendance has already done today, You can't check in again." : "Already checked in today. Please check out before punching in again."
    throw new ApiError({
      statusCode: 409,
      code,
      message,
    });
  }

  const attendanceType = ipValidationService.getAttendanceType(ipAddress);

  let isLateCheckIn = false;
  if (employee.shift) {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [shiftStartHour, shiftStartMinute] = employee.shift.startTime.split(':').map(Number);
    const shiftStartInMinutes = shiftStartHour * 60 + shiftStartMinute;

    const allowedCheckInTime = shiftStartInMinutes - 30;

    const bufferEndTime = shiftStartInMinutes + 15;

    if (currentTimeInMinutes < allowedCheckInTime) {
      throw new ApiError({
        statusCode: 409,
        code: "EARLY_CHECK_IN",
        message: `Cannot check in before ${Math.floor(allowedCheckInTime / 60).toString().padStart(2, '0')}:${(allowedCheckInTime % 60).toString().padStart(2, '0')}. Your shift starts at ${employee.shift.startTime}.`,
      });
    }

    if (currentTimeInMinutes > bufferEndTime) {
      isLateCheckIn = true;
    }
  }

  const record = existing
    ? await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkIn: new Date(),
        type: isLateCheckIn ? `${attendanceType}_LATE` : attendanceType,
        ipAddress: ipAddress,
        shiftId: employee.shiftId,
      },
    })
    : await prisma.attendance.create({
      data: {
        employeeId: eid,
        date: day,
        checkIn: new Date(),
        type: isLateCheckIn ? `${attendanceType}_LATE` : attendanceType,
        ipAddress: ipAddress,
        shiftId: employee.shiftId,
      },
    });

  let latenessMinutes = 0;
  if (employee.shift && isLateCheckIn) {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [shiftStartHour, shiftStartMinute] = employee.shift.startTime.split(':').map(Number);
    const shiftStartInMinutes = shiftStartHour * 60 + shiftStartMinute;
    const bufferEndTime = shiftStartInMinutes + 15;

    latenessMinutes = currentTimeInMinutes - bufferEndTime;
  }

  await writeAuditLog({
    action: "CHECK_IN",
    entity: "Attendance",
    entityId: record.id.toString(),
    performedBy: employeeId,
    metadata: {
      shiftId: employee.shiftId,
      shiftName: employee.shift?.name,
      isLateCheckIn: isLateCheckIn,
      latenessMinutes: latenessMinutes,
      checkInTime: new Date().toTimeString(),
    },
  });

  return record;
}

export async function checkOut(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  await AttendanceValidationService.validateEmployeeAttendanceEligibility(eid, day);

  const employee = await prisma.employee.findUnique({
    where: { id: eid },
    include: { shift: true },
  });

  if (!employee) {
    throw new ApiError({
      statusCode: 404,
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee not found",
    });
  }

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

  // Validate shift timing if employee has a shift assigned
  if (employee.shift) {
    const currentHour = checkOutTime.getHours();
    const currentMinute = checkOutTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [shiftEndHour, shiftEndMinute] = employee.shift.endTime.split(':').map(Number);
    const shiftEndInMinutes = shiftEndHour * 60 + shiftEndMinute;

    // Allow check-out 30 minutes after shift end
    const allowedCheckOutTime = shiftEndInMinutes + 30;

    if (currentTimeInMinutes > allowedCheckOutTime) {
      // This is just a warning, not blocking checkout
      console.warn(`Late checkout detected for employee ${employee.employeeId} at ${checkOutTime.toTimeString()}`);
    }
  }

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
    metadata: {
      shiftId: employee.shiftId,
      shiftName: employee.shift?.name,
      duration: duration,
    },
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

  // Validate date range request
  const validation = await AttendanceValidationService.validateAttendanceDateRange(
    eid,
    filters?.startDate,
    filters?.endDate
  );

  if (!validation.isValid) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_DATE_RANGE",
      message: validation.message || "Invalid date range for attendance query",
    });
  }

  // Get attendance query filters that respect employment period
  const whereClause = await AttendanceValidationService.getAttendanceQueryFilters(eid, filters);

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

  // Validate employee eligibility (but don't throw error, just return status)
  try {
    await AttendanceValidationService.validateEmployeeAttendanceEligibility(eid, day);
  } catch (error) {
    // Return inactive status if employee is not eligible
    return {
      hasActiveSession: false,
      attendance: null,
      eligibilityError: error instanceof ApiError ? error.message : "Employee not eligible for attendance",
    };
  }

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

  // Validate employee eligibility for attendance operations
  await AttendanceValidationService.validateEmployeeAttendanceEligibility(eid, day);

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

  // Validate employee eligibility for attendance operations
  await AttendanceValidationService.validateEmployeeAttendanceEligibility(eid, day);

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
