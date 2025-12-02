/**
 * Role hierarchy and utilities for role-based access control
 */

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

/**
 * Role hierarchy from highest to lowest privilege
 * SUPER_ADMIN > ADMIN > HR > MANAGER > EMPLOYEE
 */
const ROLE_HIERARCHY: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR',
  'MANAGER',
  'EMPLOYEE',
];

/**
 * Get the priority value for a role (lower number = higher priority)
 */
const getRolePriority = (role: AppRole): number => {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

/**
 * Determine the highest privilege role from a list of roles
 * @param roles - Array of user roles
 * @returns The role with the highest privilege, or null if no valid roles
 */
export const getHighestPriorityRole = (roles: string[]): AppRole | null => {
  if (!roles || roles.length === 0) {
    return null;
  }

  let highestRole: AppRole | null = null;
  let highestPriority = Number.MAX_SAFE_INTEGER;

  for (const role of roles) {
    const priority = getRolePriority(role as AppRole);
    if (priority < highestPriority) {
      highestPriority = priority;
      highestRole = role as AppRole;
    }
  }

  return highestRole;
};

/**
 * Dashboard route mapping for each role
 */
const ROLE_DASHBOARD_MAP: Record<AppRole, string> = {
  SUPER_ADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  HR: '/hr/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard',
};

/**
 * Get the appropriate dashboard route for a user based on their roles
 * Uses the highest privilege role to determine the route
 * @param roles - Array of user roles
 * @returns The dashboard route path, or '/' as fallback
 */
export const getDashboardRoute = (roles: string[]): string => {
  const highestRole = getHighestPriorityRole(roles);
  
  if (!highestRole) {
    return '/';
  }

  return ROLE_DASHBOARD_MAP[highestRole] || '/';
};
