// ──────────────────────────────────────────
// @prism/auth — Authentication & RBAC
// ──────────────────────────────────────────

export { validateRole, hasPermission } from './rbac';
export {
  ROLE_CONFIG,
  departmentToRole,
  hasAppPermission,
  canAccessDashboard,
  validateRolePassword,
  findRoleByPassword,
  moduleToDashboardSlug,
  isOperationalEmployee,
  isAutoLoginDesignation,
} from './roles';
export type {
  AuthUser,
  AuthSession,
  UserRole,
  AppPermission,
  DashboardSlug,
  RoleConfig,
} from './types';
