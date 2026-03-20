// ──────────────────────────────────────────
// Auth Types — Department-based RBAC
// ──────────────────────────────────────────

export type UserRole =
  | 'hr'
  | 'training'
  | 'qa'
  | 'finance'
  | 'operations'
  | 'store'
  | 'campus-hiring'
  | 'admin'
  | 'editor';

export type AppPermission =
  | 'admin'
  | 'operations'
  | 'hr'
  | 'qa'
  | 'training'
  | 'finance'
  | 'shlp'
  | 'campus-hiring'
  | 'bench-planning'
  | 'brew-league'
  | 'dashboard';

export type DashboardSlug =
  | 'hr-dashboard'
  | 'operations-dashboard'
  | 'training-dashboard'
  | 'qa-dashboard'
  | 'finance-dashboard'
  | 'shlp-dashboard'
  | 'campus-hiring-dashboard'
  | 'bench-planning-dashboard'
  | 'bench-planning-sm-asm-dashboard'
  | 'trainer-calendar-dashboard'
  | 'consolidated-dashboard'
  | 'all';

export interface RoleConfig {
  password: string;
  label: string;
  color: string;
  permissions: AppPermission[];
  dashboardAccess: DashboardSlug[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  roleId: string;
  role: UserRole;
  empId: string;
  department?: string;
  designation?: string;
  storeName?: string;
}

export interface AuthSession {
  user: AuthUser;
  permissions: AppPermission[];
  dashboardAccess: DashboardSlug[];
  expiresAt: string;
}

export interface Permission {
  id: string;
  name: string;
}

export interface RolePermissions {
  roleId: string;
  roleName: UserRole;
  permissions: Permission[];
}
