import { z } from "zod";

// Base Employee DTO Schema
export const EmployeeBaseSchema = z.object({
  id: z.number(),
  employeeId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  departmentId: z.number().nullable(),
  jobRoleId: z.number().nullable(),
  shiftId: z.number().nullable(),
  hireDate: z.string().nullable(),
  terminationDate: z.string().nullable(),
  status: z.enum(["active", "inactive", "terminated"]),
  salary: z.number().nullable(),
  leaveAllowance: z.number().nullable(),
  lastLogin: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Employee with Relations Schema
export const EmployeeWithRelationsSchema = EmployeeBaseSchema.extend({
  department: z.object({
    id: z.number(),
    name: z.string(),
  }).nullable(),
  jobRole: z.object({
    id: z.number(),
    title: z.string(),
  }).nullable(),
  shift: z.object({
    id: z.number(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    breakTime: z.number(),
    isDefault: z.boolean().optional(),
  }).nullable(),
});

// Create Employee DTO Schema
export const CreateEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  departmentId: z.number().nullable().optional(),
  jobRoleId: z.number().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  terminationDate: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
  leaveAllowance: z.number().nullable().optional(),
});

// Update Employee DTO Schema
export const UpdateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  departmentId: z.number().nullable().optional(),
  jobRoleId: z.number().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  terminationDate: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "terminated"]).optional(),
  salary: z.number().nullable().optional(),
  leaveAllowance: z.number().nullable().optional(),
});

// Employee List Item DTO Schema (for list views)
export const EmployeeListItemSchema = z.object({
  id: z.number(),
  employeeId: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(["active", "inactive", "terminated"]),
  department: z.object({
    id: z.number(),
    name: z.string(),
  }).nullable(),
  jobRole: z.object({
    id: z.number(),
    title: z.string(),
  }).nullable(),
  shift: z.object({
    id: z.number(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    breakTime: z.number(),
    isDefault: z.boolean().optional(),
  }).nullable(),
  createdAt: z.string(),
});

// Employee Profile DTO Schema (for profile views)
export const EmployeeProfileSchema = EmployeeWithRelationsSchema;

// Type exports
export type EmployeeBase = z.infer<typeof EmployeeBaseSchema>;
export type EmployeeWithRelations = z.infer<typeof EmployeeWithRelationsSchema>;
export type CreateEmployeeDTO = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDTO = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeListItem = z.infer<typeof EmployeeListItemSchema>;
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;

// DTO Transformation Functions
export class EmployeeDTO {
  /**
   * Transform Prisma employee data to safe DTO format
   */
  static toEmployeeProfile(employee: any): EmployeeProfile {
    return EmployeeProfileSchema.parse({
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone ?? null,
      dateOfBirth: employee.dateOfBirth?.toISOString() ?? null,
      departmentId: employee.departmentId ?? null,
      jobRoleId: employee.jobRoleId ?? null,
      shiftId: employee.shiftId ?? null,
      hireDate: employee.hireDate?.toISOString() ?? null,
      terminationDate: employee.terminationDate?.toISOString() ?? null,
      status: employee.status,
      salary: employee.salary ?? null,
      leaveAllowance: employee.leaveAllowance ?? null,
      lastLogin: employee.lastLogin?.toISOString() || null,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
      department: employee.department ? {
        id: employee.department.id,
        name: employee.department.name,
      } : null,
      jobRole: employee.jobRole ? {
        id: employee.jobRole.id,
        title: employee.jobRole.title,
      } : null,
      shift: employee.shift ? {
        id: employee.shift.id,
        name: employee.shift.name,
        startTime: employee.shift.startTime,
        endTime: employee.shift.endTime,
        breakTime: employee.shift.breakTime,
        isDefault: employee.shift.isDefault,
      } : null,
    });
  }

  /**
   * Transform Prisma employee data to list item format
   */
  static toEmployeeListItem(employee: any): EmployeeListItem {
    return EmployeeListItemSchema.parse({
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      department: employee.department ? {
        id: employee.department.id,
        name: employee.department.name,
      } : null,
      jobRole: employee.jobRole ? {
        id: employee.jobRole.id,
        title: employee.jobRole.title,
      } : null,
      shift: employee.shift ? {
        id: employee.shift.id,
        name: employee.shift.name,
        startTime: employee.shift.startTime,
        endTime: employee.shift.endTime,
        breakTime: employee.shift.breakTime,
        isDefault: employee.shift.isDefault,
      } : null,
      createdAt: employee.createdAt.toISOString(),
    });
  }

  /**
   * Transform array of employees to list items
   */
  static toEmployeeList(employees: any[]): EmployeeListItem[] {
    return employees.map(employee => this.toEmployeeListItem(employee));
  }

  /**
   * Validate and transform create employee data
   */
  static validateCreateData(data: any): CreateEmployeeDTO {
    return CreateEmployeeSchema.parse(data);
  }

  /**
   * Validate and transform update employee data
   */
  static validateUpdateData(data: any): UpdateEmployeeDTO {
    return UpdateEmployeeSchema.parse(data);
  }

  /**
   * Safe parse with error handling
   */
  static safeParseProfile(data: any): { success: true; data: EmployeeProfile } | { success: false; error: string } {
    try {
      const result = EmployeeProfileSchema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown parsing error' };
    }
  }

  /**
   * Transform update data for Prisma
   */
  static transformUpdateDataForPrisma(data: UpdateEmployeeDTO): any {
    const prismaData: any = {};

    // Direct field mappings
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.email !== undefined) prismaData.email = data.email.toLowerCase();
    if (data.phone !== undefined) prismaData.phone = data.phone;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.salary !== undefined) prismaData.salary = data.salary;
    if (data.leaveAllowance !== undefined) prismaData.leaveAllowance = data.leaveAllowance;
    if (data.dateOfBirth !== undefined) {
      prismaData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.hireDate !== undefined) {
      prismaData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
    }
    if (data.terminationDate !== undefined) {
      prismaData.terminationDate = data.terminationDate ? new Date(data.terminationDate) : null;
    }

    // Handle department relation
    if (data.departmentId !== undefined) {
      if (data.departmentId === null) {
        prismaData.department = { disconnect: true };
      } else {
        prismaData.department = { connect: { id: data.departmentId } };
      }
    }

    // Handle job role relation
    if (data.jobRoleId !== undefined) {
      if (data.jobRoleId === null) {
        prismaData.jobRole = { disconnect: true };
      } else {
        prismaData.jobRole = { connect: { id: data.jobRoleId } };
      }
    }

    return prismaData;
  }
}

// Response wrapper schemas
export const EmployeeResponseSchema = z.object({
  employee: EmployeeProfileSchema,
});

export const EmployeeListResponseSchema = z.object({
  employees: z.array(EmployeeListItemSchema),
});

export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>;
export type EmployeeListResponse = z.infer<typeof EmployeeListResponseSchema>;