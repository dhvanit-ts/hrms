import prisma from "@/config/db.js";
import ApiError from "@/core/http/ApiError.js";

/**
 * Service for validating attendance operations based on employee employment status and dates
 */
export class AttendanceValidationService {
  /**
   * Validate if an employee can perform attendance operations on a given date
   */
  static async validateEmployeeAttendanceEligibility(
    employeeId: number,
    date: Date = new Date()
  ): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        status: true,
        hireDate: true,
        terminationDate: true,
      },
    });

    if (!employee) {
      throw new ApiError({
        statusCode: 404,
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });
    }

    // Check if employee is active
    if (employee.status !== "active") {
      throw new ApiError({
        statusCode: 403,
        code: "EMPLOYEE_NOT_ACTIVE",
        message: `Cannot record attendance for ${employee.status} employee`,
      });
    }

    // Check if attendance date is before hire date
    if (employee.hireDate && date < employee.hireDate) {
      throw new ApiError({
        statusCode: 403,
        code: "ATTENDANCE_BEFORE_HIRE_DATE",
        message: `Cannot record attendance before employee hire date (${employee.hireDate.toDateString()})`,
      });
    }

    // Check if attendance date is after termination date
    if (employee.terminationDate && date > employee.terminationDate) {
      throw new ApiError({
        statusCode: 403,
        code: "ATTENDANCE_AFTER_TERMINATION_DATE",
        message: `Cannot record attendance after employee termination date (${employee.terminationDate.toDateString()})`,
      });
    }
  }

  /**
   * Get valid attendance date range for an employee
   */
  static async getEmployeeAttendanceDateRange(employeeId: number): Promise<{
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
  }> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        status: true,
        hireDate: true,
        terminationDate: true,
      },
    });

    if (!employee) {
      throw new ApiError({
        statusCode: 404,
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });
    }

    return {
      startDate: employee.hireDate,
      endDate: employee.terminationDate,
      isActive: employee.status === "active",
    };
  }

  /**
   * Filter attendance records to only include those within employment period
   */
  static async filterAttendanceByEmploymentPeriod(
    employeeId: number,
    attendanceRecords: any[]
  ): Promise<any[]> {
    const { startDate, endDate } = await this.getEmployeeAttendanceDateRange(employeeId);

    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date);

      // Filter out records before hire date
      if (startDate && recordDate < startDate) {
        return false;
      }

      // Filter out records after termination date
      if (endDate && recordDate > endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get attendance query filters based on employee employment period
   */
  static async getAttendanceQueryFilters(
    employeeId: number,
    additionalFilters?: { startDate?: string; endDate?: string }
  ): Promise<any> {
    const { startDate: hireDate, endDate: terminationDate } = await this.getEmployeeAttendanceDateRange(employeeId);

    const whereClause: any = {
      employeeId,
    };

    // Build date filter considering employment period
    const dateFilter: any = {};

    // Determine effective start date (later of hire date or requested start date)
    let effectiveStartDate = hireDate;
    if (additionalFilters?.startDate) {
      const requestedStartDate = new Date(additionalFilters.startDate);
      if (!effectiveStartDate || requestedStartDate > effectiveStartDate) {
        effectiveStartDate = requestedStartDate;
      }
    }

    // Determine effective end date (earlier of termination date or requested end date)
    let effectiveEndDate = terminationDate;
    if (additionalFilters?.endDate) {
      const requestedEndDate = new Date(additionalFilters.endDate);
      if (!effectiveEndDate || requestedEndDate < effectiveEndDate) {
        effectiveEndDate = requestedEndDate;
      }
    }

    // Apply date filters
    if (effectiveStartDate) {
      const startDay = new Date(effectiveStartDate.getFullYear(), effectiveStartDate.getMonth(), effectiveStartDate.getDate());
      dateFilter.gte = startDay;
    }

    if (effectiveEndDate) {
      const endDay = new Date(effectiveEndDate.getFullYear(), effectiveEndDate.getMonth(), effectiveEndDate.getDate());
      const nextDay = new Date(endDay);
      nextDay.setDate(endDay.getDate() + 1);
      dateFilter.lt = nextDay;
    }

    // Only add date filter if we have constraints
    if (Object.keys(dateFilter).length > 0) {
      whereClause.date = dateFilter;
    }

    return whereClause;
  }

  /**
   * Validate attendance date range request
   */
  static async validateAttendanceDateRange(
    employeeId: number,
    startDate?: string,
    endDate?: string
  ): Promise<{ isValid: boolean; message?: string }> {
    const { startDate: hireDate, endDate: terminationDate, isActive } = await this.getEmployeeAttendanceDateRange(employeeId);

    if (!isActive) {
      return {
        isValid: false,
        message: "Cannot query attendance for inactive employee",
      };
    }

    if (startDate && hireDate) {
      const requestedStart = new Date(startDate);
      if (requestedStart < hireDate) {
        return {
          isValid: false,
          message: `Start date cannot be before employee hire date (${hireDate.toDateString()})`,
        };
      }
    }

    if (endDate && terminationDate) {
      const requestedEnd = new Date(endDate);
      if (requestedEnd > terminationDate) {
        return {
          isValid: false,
          message: `End date cannot be after employee termination date (${terminationDate.toDateString()})`,
        };
      }
    }

    return { isValid: true };
  }
}