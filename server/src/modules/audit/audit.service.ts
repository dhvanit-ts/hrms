import prisma from "@/config/db.js";
import { Prisma } from "@prisma/client";

export interface AuditFilters {
  entity?: string;
  action?: string;
  performedBy?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditReportsParams {
  page: number;
  limit: number;
  filters: AuditFilters;
}

interface UserDetails {
  userId: number;
  username: string;
  email: string;
  userType: 'admin' | 'employee';
}

interface EntityDetails {
  entityId: string;
  entityType: string;
  entityName: string;
  entityDescription?: string;
  additionalInfo?: Record<string, any>;
}

// Helper function to get user details from either User or Employee table
async function getUserDetails(performedById: number | null): Promise<UserDetails | null> {
  if (!performedById) {
    return null;
  }

  // First, try to find in User table (admin/HR staff)
  const user = await prisma.user.findUnique({
    where: { id: performedById },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          id: true,
        }
      }
    }
  });

  if (user) {
    return {
      userId: user.id,
      username: user.email.split('@')[0], // Use email prefix as username for admin users
      email: user.email,
      userType: 'admin'
    };
  }

  // If not found in User table, try Employee table
  const employee = await prisma.employee.findUnique({
    where: { id: performedById },
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
    }
  });

  if (employee) {
    return {
      userId: employee.id,
      username: employee.name,
      email: employee.email,
      userType: 'employee'
    };
  }

  // If not found in either table, return null
  return null;
}

// Helper function to get entity details based on entity type and ID
async function getEntityDetails(entityType: string, entityId: string): Promise<EntityDetails | null> {
  if (!entityId || !entityType) {
    return null;
  }

  const id = parseInt(entityId);
  if (isNaN(id)) {
    // Handle cases where entityId might be a comma-separated list (like employee IDs)
    return {
      entityId,
      entityType,
      entityName: `Multiple ${entityType}s`,
      entityDescription: `Multiple ${entityType.toLowerCase()}s: ${entityId}`,
    };
  }

  try {
    switch (entityType) {
      case 'Employee': {
        const employee = await prisma.employee.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: { select: { name: true } },
            jobRole: { select: { title: true } },
          }
        });

        if (employee) {
          return {
            entityId,
            entityType,
            entityName: `Employee: ${employee.name}`,
            entityDescription: `${employee.employeeId} - ${employee.email}`,
            additionalInfo: {
              department: employee.department?.name,
              jobRole: employee.jobRole?.title,
            }
          };
        }
        break;
      }

      case 'User': {
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            roles: true,
          }
        });

        if (user) {
          return {
            entityId,
            entityType,
            entityName: `User: ${user.email.split('@')[0]}`,
            entityDescription: user.email,
            additionalInfo: {
              roles: user.roles,
            }
          };
        }
        break;
      }

      case 'Department': {
        const department = await prisma.department.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            manager: { select: { name: true } },
          }
        });

        if (department) {
          return {
            entityId,
            entityType,
            entityName: `Department: ${department.name}`,
            entityDescription: `Managed by ${department.manager?.name || 'No manager'}`,
            additionalInfo: {
              manager: department.manager?.name,
            }
          };
        }
        break;
      }

      case 'JobRole': {
        const jobRole = await prisma.jobRole.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            level: true,
          }
        });

        if (jobRole) {
          return {
            entityId,
            entityType,
            entityName: `Job Role: ${jobRole.title}`,
            entityDescription: `Level ${jobRole.level}`,
            additionalInfo: {
              level: jobRole.level,
            }
          };
        }
        break;
      }

      case 'Shift': {
        const shift = await prisma.shift.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            isDefault: true,
          }
        });

        if (shift) {
          return {
            entityId,
            entityType,
            entityName: `Shift: ${shift.name}`,
            entityDescription: `${shift.startTime} - ${shift.endTime}`,
            additionalInfo: {
              isDefault: shift.isDefault,
              timeRange: `${shift.startTime} - ${shift.endTime}`,
            }
          };
        }
        break;
      }

      case 'LeaveRequest': {
        const leaveRequest = await prisma.leaveRequest.findUnique({
          where: { id },
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true,
            employee: { select: { name: true } },
          }
        });

        if (leaveRequest) {
          return {
            entityId,
            entityType,
            entityName: `Leave Request: ${leaveRequest.type}`,
            entityDescription: `${leaveRequest.employee.name} (${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()})`,
            additionalInfo: {
              status: leaveRequest.status,
              employee: leaveRequest.employee.name,
              type: leaveRequest.type,
            }
          };
        }
        break;
      }

      case 'Attendance': {
        const attendance = await prisma.attendance.findUnique({
          where: { id },
          select: {
            id: true,
            date: true,
            checkIn: true,
            checkOut: true,
            employee: { select: { name: true } },
          }
        });

        if (attendance) {
          return {
            entityId,
            entityType,
            entityName: `Attendance: ${attendance.employee.name}`,
            entityDescription: `${attendance.date.toDateString()}`,
            additionalInfo: {
              employee: attendance.employee.name,
              date: attendance.date.toDateString(),
              checkIn: attendance.checkIn?.toLocaleTimeString(),
              checkOut: attendance.checkOut?.toLocaleTimeString(),
            }
          };
        }
        break;
      }

      case 'Break': {
        const breakRecord = await prisma.break.findUnique({
          where: { id },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            attendance: {
              select: {
                employee: { select: { name: true } },
                date: true,
              }
            }
          }
        });

        if (breakRecord) {
          return {
            entityId,
            entityType,
            entityName: `Break: ${breakRecord.attendance.employee.name}`,
            entityDescription: `${breakRecord.attendance.date.toDateString()}`,
            additionalInfo: {
              employee: breakRecord.attendance.employee.name,
              date: breakRecord.attendance.date.toDateString(),
              startTime: breakRecord.startTime.toLocaleTimeString(),
              endTime: breakRecord.endTime?.toLocaleTimeString(),
            }
          };
        }
        break;
      }

      case 'BankDetails': {
        const bankDetails = await prisma.bankDetails.findUnique({
          where: { id },
          select: {
            id: true,
            bankName: true,
            accountType: true,
            employee: { select: { name: true } },
          }
        });

        if (bankDetails) {
          return {
            entityId,
            entityType,
            entityName: `Bank Details: ${bankDetails.employee.name}`,
            entityDescription: `${bankDetails.bankName} (${bankDetails.accountType})`,
            additionalInfo: {
              employee: bankDetails.employee.name,
              bankName: bankDetails.bankName,
              accountType: bankDetails.accountType,
            }
          };
        }
        break;
      }

      case 'Payroll': {
        const payroll = await prisma.payroll.findUnique({
          where: { id },
          select: {
            id: true,
            salary: true,
            payDate: true,
            employee: { select: { name: true } },
          }
        });

        if (payroll) {
          return {
            entityId,
            entityType,
            entityName: `Payroll: ${payroll.employee.name}`,
            entityDescription: `${payroll.payDate.toDateString()} - $${payroll.salary}`,
            additionalInfo: {
              employee: payroll.employee.name,
              salary: payroll.salary.toString(),
              payDate: payroll.payDate.toDateString(),
            }
          };
        }
        break;
      }

      default:
        // For unknown entity types, return basic info
        return {
          entityId,
          entityType,
          entityName: `${entityType} #${entityId}`,
          entityDescription: `${entityType} with ID ${entityId}`,
        };
    }
  } catch (error) {
    console.error(`Error fetching entity details for ${entityType} ${entityId}:`, error);
  }

  // If entity not found or error occurred, return basic info
  return {
    entityId,
    entityType,
    entityName: `${entityType} #${entityId}`,
    entityDescription: `${entityType} with ID ${entityId} (not found)`,
  };
}

export async function getAuditReports({ page, limit, filters }: AuditReportsParams) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.entity) {
    where.entity = { contains: filters.entity };
  }

  if (filters.action) {
    where.action = { contains: filters.action };
  }

  if (filters.performedBy) {
    where.performedBy = filters.performedBy;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  // Get total count for pagination
  const total = await prisma.auditLog.count({ where });

  // Get audit logs with pagination
  const auditLogs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    skip,
    take: limit,
  });

  // Enhance audit logs with user and entity details
  const enhancedAuditLogs = await Promise.all(
    auditLogs.map(async (log) => {
      const [userDetails, entityDetails] = await Promise.all([
        getUserDetails(log.performedBy),
        getEntityDetails(log.entity, log.entityId)
      ]);

      return {
        ...log,
        performedBy: userDetails,
        entityDetails,
      };
    })
  );

  return {
    data: enhancedAuditLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
}

export async function getAuditReportById(id: number) {
  const auditLog = await prisma.auditLog.findUnique({
    where: { id },
  });

  if (!auditLog) {
    return null;
  }

  // Enhance with user and entity details
  const [userDetails, entityDetails] = await Promise.all([
    getUserDetails(auditLog.performedBy),
    getEntityDetails(auditLog.entity, auditLog.entityId)
  ]);

  return {
    ...auditLog,
    performedBy: userDetails,
    entityDetails,
  };
}

export async function getAuditStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfDay } }
    }),
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfWeek } }
    }),
    prisma.auditLog.count({
      where: { timestamp: { gte: startOfMonth } }
    }),
    prisma.auditLog.count(),
  ]);

  return {
    today: todayCount,
    week: weekCount,
    month: monthCount,
    total: totalCount,
  };
}