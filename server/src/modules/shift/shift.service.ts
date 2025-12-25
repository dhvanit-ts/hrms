import prisma from "@/config/db.js";
import ApiError from "@/core/http/ApiError.js";
import { writeAuditLog } from "@/infra/services/audit.service.js";

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  breakTime?: number;
  description?: string;
}

export interface UpdateShiftData {
  name?: string;
  startTime?: string;
  endTime?: string;
  breakTime?: number;
  description?: string;
  isActive?: boolean;
}

/**
 * Validate shift time format (HH:MM)
 */
function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Convert time string to minutes for comparison
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate shift duration in minutes, handling overnight shifts
 */
function calculateShiftDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // If end time is less than start time, it's an overnight shift
  if (endMinutes < startMinutes) {
    // Add 24 hours (1440 minutes) to end time for overnight calculation
    return (endMinutes + 1440) - startMinutes;
  }

  return endMinutes - startMinutes;
}

/**
 * Validate shift times
 */
function validateShiftTimes(startTime: string, endTime: string): void {
  if (!validateTimeFormat(startTime)) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_START_TIME",
      message: "Start time must be in HH:MM format (e.g., 09:00)",
    });
  }

  if (!validateTimeFormat(endTime)) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_END_TIME",
      message: "End time must be in HH:MM format (e.g., 17:00)",
    });
  }

  // Don't allow same start and end time
  if (startTime === endTime) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_TIME_RANGE",
      message: "Start time and end time cannot be the same",
    });
  }

  // Check for reasonable shift duration (at least 1 hour, max 24 hours)
  const durationMinutes = calculateShiftDuration(startTime, endTime);

  if (durationMinutes < 60) {
    throw new ApiError({
      statusCode: 400,
      code: "SHIFT_TOO_SHORT",
      message: "Shift duration must be at least 1 hour",
    });
  }

  if (durationMinutes > 1440) { // 24 hours
    throw new ApiError({
      statusCode: 400,
      code: "SHIFT_TOO_LONG",
      message: "Shift duration cannot exceed 24 hours",
    });
  }
}

/**
 * Create a new shift
 */
export async function createShift(data: CreateShiftData, performedBy: string) {
  validateShiftTimes(data.startTime, data.endTime);

  // Check if shift name already exists
  const existingShift = await prisma.shift.findUnique({
    where: { name: data.name },
  });

  if (existingShift) {
    throw new ApiError({
      statusCode: 409,
      code: "SHIFT_NAME_EXISTS",
      message: "A shift with this name already exists",
    });
  }

  const shift = await prisma.shift.create({
    data: {
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      breakTime: data.breakTime || 60,
      description: data.description,
    },
  });

  await writeAuditLog({
    action: "CREATE_SHIFT",
    entity: "Shift",
    entityId: shift.id.toString(),
    performedBy,
    metadata: { shiftName: shift.name },
  });

  return shift;
}

/**
 * Get all shifts
 */
export async function getAllShifts(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  return await prisma.shift.findMany({
    where,
    include: {
      _count: {
        select: {
          employees: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get shift by ID
 */
export async function getShiftById(id: number) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      employees: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          employees: true,
          attendances: true,
        },
      },
    },
  });

  if (!shift) {
    throw new ApiError({
      statusCode: 404,
      code: "SHIFT_NOT_FOUND",
      message: "Shift not found",
    });
  }

  return shift;
}

/**
 * Update shift
 */
export async function updateShift(id: number, data: UpdateShiftData, performedBy: string) {
  const existingShift = await prisma.shift.findUnique({
    where: { id },
  });

  if (!existingShift) {
    throw new ApiError({
      statusCode: 404,
      code: "SHIFT_NOT_FOUND",
      message: "Shift not found",
    });
  }

  // Validate times if provided
  if (data.startTime || data.endTime) {
    const startTime = data.startTime || existingShift.startTime;
    const endTime = data.endTime || existingShift.endTime;
    validateShiftTimes(startTime, endTime);
  }

  // Check if new name conflicts with existing shift
  if (data.name && data.name !== existingShift.name) {
    const nameConflict = await prisma.shift.findUnique({
      where: { name: data.name },
    });

    if (nameConflict) {
      throw new ApiError({
        statusCode: 409,
        code: "SHIFT_NAME_EXISTS",
        message: "A shift with this name already exists",
      });
    }
  }

  const updatedShift = await prisma.shift.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    action: "UPDATE_SHIFT",
    entity: "Shift",
    entityId: updatedShift.id.toString(),
    performedBy,
    metadata: {
      shiftName: updatedShift.name,
      changes: data,
    },
  });

  return updatedShift;
}

/**
 * Delete shift (hard delete from database)
 */
export async function deleteShift(id: number, performedBy: string) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  if (!shift) {
    throw new ApiError({
      statusCode: 404,
      code: "SHIFT_NOT_FOUND",
      message: "Shift not found",
    });
  }

  // Check if shift has assigned employees
  if (shift._count.employees > 0) {
    throw new ApiError({
      statusCode: 409,
      code: "SHIFT_HAS_EMPLOYEES",
      message: "Cannot delete shift that has assigned employees. Please reassign employees first.",
    });
  }

  // Hard delete the shift from database
  const deletedShift = await prisma.shift.delete({
    where: { id },
  });

  await writeAuditLog({
    action: "DELETE_SHIFT",
    entity: "Shift",
    entityId: deletedShift.id.toString(),
    performedBy,
    metadata: { shiftName: deletedShift.name },
  });

  return deletedShift;
}

export async function updateDefaultShiftHandler(
  shiftId: number,
  performedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId }
    })

    if (!shift || !shift.isActive) {
      throw new ApiError({
        statusCode: 404,
        code: "SHIFT_NOT_FOUND",
        message: "Active shift not found",
      })
    }

    if (shift.isDefault) {
      return { success: true, updatedDefaultShift: shift }
    }

    await tx.shift.updateMany({
      where: { isDefault: true, isActive: true },
      data: { isDefault: false }
    })

    const updatedDefaultShift = await tx.shift.update({
      where: { id: shiftId },
      data: { isDefault: true }
    })

    await writeAuditLog({
      action: "CHANGE_DEFAULT_SHIFT",
      entity: "Shift",
      entityId: shiftId.toString(),
      performedBy,
      metadata: {
        shiftName: shift.name,
      },
    })

    return { success: true, updatedDefaultShift }
  })
}

/**
 * Assign employees to shift
 */
export async function assignEmployeesToShift(shiftId: number, employeeIds: number[], performedBy: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId, isActive: true },
  });

  if (!shift) {
    throw new ApiError({
      statusCode: 404,
      code: "SHIFT_NOT_FOUND",
      message: "Active shift not found",
    });
  }

  // Verify all employees exist and are active
  const employees = await prisma.employee.findMany({
    where: {
      id: { in: employeeIds },
      status: 'active',
    },
  });

  if (employees.length !== employeeIds.length) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_EMPLOYEES",
      message: "One or more employees not found or inactive",
    });
  }

  // Update employees with new shift
  await prisma.employee.updateMany({
    where: { id: { in: employeeIds } },
    data: { shiftId },
  });

  await writeAuditLog({
    action: "ASSIGN_EMPLOYEES_TO_SHIFT",
    entity: "Shift",
    entityId: shiftId.toString(),
    performedBy,
    metadata: {
      shiftName: shift.name,
      employeeCount: employeeIds.length,
      employeeIds,
    },
  });

  return { success: true, assignedCount: employeeIds.length };
}

/**
 * Remove employees from shift
 */
export async function removeEmployeesFromShift(employeeIds: number[], performedBy: string) {
  // Verify employees exist
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    include: { shift: true },
  });

  if (employees.length !== employeeIds.length) {
    throw new ApiError({
      statusCode: 400,
      code: "INVALID_EMPLOYEES",
      message: "One or more employees not found",
    });
  }

  // Update employees to remove shift assignment
  await prisma.employee.updateMany({
    where: { id: { in: employeeIds } },
    data: { shiftId: null },
  });

  await writeAuditLog({
    action: "REMOVE_EMPLOYEES_FROM_SHIFT",
    entity: "Employee",
    entityId: employeeIds.join(','),
    performedBy,
    metadata: {
      employeeCount: employeeIds.length,
      employeeIds,
    },
  });

  return { success: true, removedCount: employeeIds.length };
}

/**
 * Get shift schedule for a specific date range
 */
export async function getShiftSchedule(startDate?: string, endDate?: string) {
  const employees = await prisma.employee.findMany({
    where: {
      status: 'active',
      shiftId: { not: null },
    },
    include: {
      shift: true,
      department: true,
    },
    orderBy: [
      { shift: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  // Group employees by shift
  const schedule = employees.reduce((acc, employee) => {
    if (!employee.shift) return acc;

    const shiftName = employee.shift.name;
    if (!acc[shiftName]) {
      acc[shiftName] = {
        shift: employee.shift,
        employees: [],
      };
    }

    acc[shiftName].employees.push({
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department?.name || 'No Department',
    });

    return acc;
  }, {} as Record<string, any>);

  return Object.values(schedule);
}