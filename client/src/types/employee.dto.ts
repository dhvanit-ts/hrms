// Frontend Employee DTO Types
// These should match the backend DTO schemas

export interface EmployeeBase {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  departmentId: number | null;
  jobRoleId: number | null;
  hireDate: string | null;
  terminationDate: string | null;
  status: "active" | "inactive" | "terminated";
  salary: number | null;
  leaveAllowance: number | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface JobRole {
  id: number;
  title: string;
}

export interface EmployeeWithRelations extends EmployeeBase {
  department: Department | null;
  jobRole: JobRole | null;
}

export interface CreateEmployeeDTO {
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  salary?: number | null;
  leaveAllowance?: number | null;
}

export interface UpdateEmployeeDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: "active" | "inactive" | "terminated";
  salary?: number | null;
  leaveAllowance?: number | null;
}

export interface EmployeeListItem {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "terminated";
  department: Department | null;
  jobRole: JobRole | null;
  createdAt: string;
}

export type EmployeeProfile = EmployeeWithRelations;

// API Response Types
export interface EmployeeResponse {
  employee: EmployeeProfile;
}

export interface EmployeeListResponse {
  employees: EmployeeListItem[];
}

// Frontend-specific utility types
export interface EmployeeFormData {
  name?: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: string | null; // HTML date input format (YYYY-MM-DD) or null
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;    // HTML date input format (YYYY-MM-DD) or null
  terminationDate?: string | null; // HTML date input format (YYYY-MM-DD) or null
  status?: "active" | "inactive" | "terminated";
  salary?: number | null;
  leaveAllowance?: number | null;
}

// Validation helpers
export class EmployeeDTOValidator {
  static isValidStatus(status: string): status is EmployeeBase['status'] {
    return ['active', 'inactive', 'terminated'].includes(status);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidEmployeeId(employeeId: string): boolean {
    return employeeId.length > 0 && employeeId.trim() !== '';
  }

  static validateCreateData(data: Partial<CreateEmployeeDTO>): string[] {
    const errors: string[] = [];

    if (!data.employeeId || !this.isValidEmployeeId(data.employeeId)) {
      errors.push('Employee ID is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    return errors;
  }

  static validateUpdateData(data: Partial<UpdateEmployeeDTO>): string[] {
    const errors: string[] = [];

    if (data.name !== undefined && data.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    if (data.email !== undefined && !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (data.status !== undefined && !this.isValidStatus(data.status)) {
      errors.push('Invalid status value');
    }

    return errors;
  }
}

// Data transformation utilities
export class EmployeeTransformer {
  /**
   * Transform API date strings to HTML date input format (YYYY-MM-DD)
   */
  static toDateInputFormat(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  /**
   * Transform HTML date input to ISO string
   */
  static fromDateInputFormat(dateInput: string): string | null {
    if (!dateInput) return null;
    return new Date(dateInput).toISOString();
  }

  /**
   * Transform employee profile for form editing
   */
  static toFormData(employee: EmployeeProfile): EmployeeFormData {
    return {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth ? this.toDateInputFormat(employee.dateOfBirth) : null,
      departmentId: employee.departmentId,
      jobRoleId: employee.jobRoleId,
      hireDate: employee.hireDate ? this.toDateInputFormat(employee.hireDate) : null,
      terminationDate: employee.terminationDate ? this.toDateInputFormat(employee.terminationDate) : null,
      status: employee.status,
      salary: employee.salary,
      leaveAllowance: employee.leaveAllowance,
    };
  }

  /**
   * Transform form data for API submission
   */
  static fromFormData(formData: EmployeeFormData): UpdateEmployeeDTO {
    const result: UpdateEmployeeDTO = {};

    if (formData.name !== undefined) result.name = formData.name;
    if (formData.email !== undefined) result.email = formData.email;
    if (formData.phone !== undefined) result.phone = formData.phone;
    if (formData.dateOfBirth !== undefined) {
      result.dateOfBirth = formData.dateOfBirth ? this.fromDateInputFormat(formData.dateOfBirth) : null;
    }
    if (formData.departmentId !== undefined) result.departmentId = formData.departmentId;
    if (formData.jobRoleId !== undefined) result.jobRoleId = formData.jobRoleId;
    if (formData.hireDate !== undefined) {
      result.hireDate = formData.hireDate ? this.fromDateInputFormat(formData.hireDate) : null;
    }
    if (formData.terminationDate !== undefined) {
      result.terminationDate = formData.terminationDate ? this.fromDateInputFormat(formData.terminationDate) : null;
    }
    if (formData.status !== undefined) result.status = formData.status;
    if (formData.salary !== undefined) result.salary = formData.salary;
    if (formData.leaveAllowance !== undefined) result.leaveAllowance = formData.leaveAllowance;

    return result;
  }

  /**
   * Format salary for display
   */
  static formatSalary(salary: number | null): string {
    if (!salary) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary);
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get status badge variant
   */
  static getStatusVariant(status: EmployeeBase['status']): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'terminated':
        return 'destructive';
      default:
        return 'secondary';
    }
  }
}

// Type guards
export function isEmployeeProfile(obj: any): obj is EmployeeProfile {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.employeeId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    ['active', 'inactive', 'terminated'].includes(obj.status)
  );
}

export function isEmployeeListItem(obj: any): obj is EmployeeListItem {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.employeeId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    ['active', 'inactive', 'terminated'].includes(obj.status)
  );
}