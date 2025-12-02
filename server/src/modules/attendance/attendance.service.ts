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
      message: "Already checked in. Please check out before punching in again.",
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
  });

  return {
    hasActiveSession: !!(attendance?.checkIn && !attendance?.checkOut),
    attendance: attendance || null,
  };
}
