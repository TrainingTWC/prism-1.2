export const APP_NAME = 'Prism Platform';

/** basePath from next.config — used for static asset URLs */
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/prism-1.2' : '';

/** Resolve a public asset path, respecting basePath */
export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROGRAMS: '/programs',
  STORES: '/stores',
  MANAGERS: '/managers',
  REGIONS: '/regions',
  EMPLOYEES: '/employees',
  TASKS: '/tasks',
  FOLLOW_UPS: '/follow-ups',
  INTELLIGENCE: '/intelligence',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  PROGRAMS: '/api/programs',
  SUBMISSIONS: '/api/submissions',
  STORES: '/api/stores',
  EMPLOYEES: '/api/employees',
  TASKS: '/api/tasks',
  FOLLOW_UPS: '/api/follow-ups',
  ANALYTICS: '/api/analytics',
  NOTIFICATIONS: '/api/notifications',
  ENTITIES: {
    STORES: '/api/entities/stores',
    MANAGERS: '/api/entities/managers',
    REGIONS: '/api/entities/regions',
    EMPLOYEES: '/api/entities/employees',
    PROGRAMS: '/api/entities/programs',
  },
} as const;
