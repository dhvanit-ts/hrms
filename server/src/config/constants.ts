export const APP_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const;
export type AppRole = typeof APP_ROLES[number];

export const DEFAULT_ACCESS_TTL = '15m';
export const DEFAULT_REFRESH_TTL = '7d';


