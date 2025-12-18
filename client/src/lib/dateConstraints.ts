import { EmploymentDates } from '@/shared/hooks/useEmployeeEmploymentDates';

export interface DateConstraints {
  min?: string; // YYYY-MM-DD format for HTML date inputs
  max?: string; // YYYY-MM-DD format for HTML date inputs
}

/**
 * Calculate date constraints based on employee employment period
 */
export function getEmploymentDateConstraints(employmentDates: EmploymentDates | null): DateConstraints {
  if (!employmentDates) {
    return {};
  }

  const constraints: DateConstraints = {};

  // Set minimum date to hire date if available
  if (employmentDates.hireDate) {
    const hireDate = new Date(employmentDates.hireDate);
    constraints.min = hireDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
  }

  // Set maximum date to termination date if available
  if (employmentDates.terminationDate) {
    const terminationDate = new Date(employmentDates.terminationDate);
    constraints.max = terminationDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
  }

  return constraints;
}

/**
 * Check if a date is within the employment period
 */
export function isDateWithinEmploymentPeriod(
  date: string | Date,
  employmentDates: EmploymentDates | null
): boolean {
  if (!employmentDates) {
    return true; // No constraints if employment dates are not available
  }

  const checkDate = typeof date === 'string' ? new Date(date) : date;

  // Check against hire date
  if (employmentDates.hireDate) {
    const hireDate = new Date(employmentDates.hireDate);
    if (checkDate < hireDate) {
      return false;
    }
  }

  // Check against termination date
  if (employmentDates.terminationDate) {
    const terminationDate = new Date(employmentDates.terminationDate);
    if (checkDate > terminationDate) {
      return false;
    }
  }

  return true;
}

/**
 * Get a user-friendly message about date constraints
 */
export function getDateConstraintMessage(employmentDates: EmploymentDates | null): string | null {
  if (!employmentDates) {
    return null;
  }

  const parts: string[] = [];

  if (employmentDates.hireDate) {
    const hireDate = new Date(employmentDates.hireDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    parts.push(`from ${hireDate}`);
  }

  if (employmentDates.terminationDate) {
    const terminationDate = new Date(employmentDates.terminationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    parts.push(`until ${terminationDate}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `Dates are limited to your employment period: ${parts.join(' ')}.`;
}