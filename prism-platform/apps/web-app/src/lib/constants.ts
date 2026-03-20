export const APP_NAME = 'Prism Platform';

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
