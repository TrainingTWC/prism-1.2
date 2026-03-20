// ──────────────────────────────────────────
// Role Configuration — Department-based RBAC
// ──────────────────────────────────────────

import type { UserRole, RoleConfig, AppPermission, DashboardSlug } from './types';

/* ── Role definitions with default passwords, permissions, and dashboard access ── */

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  hr: {
    password: 'HRConnect2024!',
    label: 'HR',
    color: '#3B82F6',
    permissions: ['hr', 'campus-hiring', 'bench-planning', 'dashboard'],
    dashboardAccess: ['hr-dashboard', 'campus-hiring-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard'],
  },
  training: {
    password: 'TrainingHub2024!',
    label: 'Training',
    color: '#A855F7',
    permissions: ['training', 'shlp', 'bench-planning', 'brew-league', 'dashboard'],
    dashboardAccess: ['training-dashboard', 'shlp-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard', 'trainer-calendar-dashboard'],
  },
  qa: {
    password: 'QualityCheck2024!',
    label: 'QA',
    color: '#EF4444',
    permissions: ['qa', 'dashboard'],
    dashboardAccess: ['qa-dashboard'],
  },
  finance: {
    password: 'FinanceSecure2024!',
    label: 'Finance',
    color: '#22C55E',
    permissions: ['finance', 'dashboard'],
    dashboardAccess: ['finance-dashboard'],
  },
  operations: {
    password: 'OpsAccess2024!',
    label: 'Operations',
    color: '#10b37d',
    permissions: ['operations', 'shlp', 'bench-planning', 'brew-league', 'dashboard'],
    dashboardAccess: ['operations-dashboard', 'shlp-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard'],
  },
  store: {
    password: 'StoreAccess2025!',
    label: 'Store Team',
    color: '#F59E0B',
    permissions: ['shlp', 'brew-league', 'bench-planning'],
    dashboardAccess: ['shlp-dashboard'],
  },
  'campus-hiring': {
    password: 'CampusHire2024!',
    label: 'Campus Hiring',
    color: '#6366F1',
    permissions: ['campus-hiring'],
    dashboardAccess: [],
  },
  admin: {
    password: 'AdminView2024!',
    label: 'Admin',
    color: '#F97316',
    permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'shlp', 'campus-hiring', 'bench-planning', 'brew-league', 'dashboard'],
    dashboardAccess: ['all', 'campus-hiring-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard', 'trainer-calendar-dashboard'],
  },
  editor: {
    password: 'Editornotcreator2025!',
    label: 'Editor',
    color: '#EC4899',
    permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'shlp', 'campus-hiring', 'bench-planning', 'brew-league', 'dashboard'],
    dashboardAccess: ['all', 'campus-hiring-dashboard', 'trainer-calendar-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard'],
  },
};

/* ── Map employee to a UserRole using empId, designation, department, dbRole ── */

export function departmentToRole(
  department: string | null | undefined,
  dbRoleName?: string,
  designation?: string | null,
  empId?: string,
): UserRole {
  // ── Special-case: H541 (Amritanshu) is always editor ──
  if (empId && empId.toUpperCase() === 'H541') return 'editor';

  // If database role is admin or editor, use that directly
  if (dbRoleName === 'editor') return 'editor';
  if (dbRoleName === 'admin') return 'admin';

  // ── Designation-based mapping (trainers, HRs, area managers from store mapping) ──
  if (designation) {
    const desig = designation.toLowerCase().trim();
    if (desig.includes('trainer') || desig.includes('training manager') || desig.includes('l&d')) return 'training';
    if (desig.includes('hrbp') || desig.includes('hr ') || desig.includes('human resource') || desig.includes('hr head') || desig.includes('regional hr')) return 'hr';
    if (desig.includes('area manager') || desig === 'am' || desig.includes('area mgr')) return 'operations';
  }

  // ── Department-based fallback ──
  if (!department) return 'store'; // default fallback

  const dept = department.toLowerCase().trim();

  if (dept.includes('hr') || dept.includes('human resource')) return 'hr';
  if (dept.includes('training') || dept.includes('trainer') || dept.includes('l&d') || dept.includes('learning')) return 'training';
  if (dept.includes('qa') || dept.includes('quality')) return 'qa';
  if (dept.includes('finance') || dept.includes('accounts') || dept.includes('accounting')) return 'finance';
  if (dept.includes('ops') || dept.includes('operation')) return 'operations';
  if (dept.includes('campus') || dept.includes('recruitment') || dept.includes('hiring')) return 'campus-hiring';
  if (dept.includes('external')) return 'campus-hiring';
  if (dept.includes('store') || dept.includes('retail') || dept.includes('barista') || dept.includes('cafe')) return 'store';

  return 'store'; // default
}

/**
 * Check if an employee code belongs to an operational employee.
 * Only codes starting with H, P, I, HK, AP are valid.
 * Campus-hire and other prefixes are excluded from calculations.
 */
export function isOperationalEmployee(empId: string): boolean {
  return /^(HK|AP|H|P|I)\d/i.test(empId.trim());
}

/**
 * Check if a designation (from store mapping) auto-identifies the role.
 * These employees skip the password screen — their role is known from the store DB.
 */
export function isAutoLoginDesignation(designation: string | null | undefined): boolean {
  if (!designation) return false;
  const d = designation.toLowerCase().trim();
  return (
    d.includes('trainer') ||
    d.includes('training manager') ||
    d.includes('l&d') ||
    d.includes('hrbp') ||
    d.includes('hr head') ||
    d.includes('regional hr') ||
    d.includes('area manager') ||
    d === 'am' ||
    d.includes('area mgr') ||
    d.includes('market manager')
  );
}

/* ── Permission helpers ── */

export function hasAppPermission(role: UserRole, permission: AppPermission): boolean {
  return ROLE_CONFIG[role]?.permissions.includes(permission) ?? false;
}

export function canAccessDashboard(role: UserRole, dashboardSlug: DashboardSlug): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;
  if (config.dashboardAccess.includes('all')) return true;
  return config.dashboardAccess.includes(dashboardSlug);
}

export function validateRolePassword(role: UserRole, password: string): boolean {
  return ROLE_CONFIG[role]?.password === password;
}

/** Check a password against all roles — returns the matching role or null */
export function findRoleByPassword(password: string): UserRole | null {
  for (const [role, config] of Object.entries(ROLE_CONFIG)) {
    if (config.password === password) return role as UserRole;
  }
  return null;
}

/** Dashboard slug from module id (e.g., 'hr' → 'hr-dashboard') */
export function moduleToDashboardSlug(moduleId: string): DashboardSlug {
  return `${moduleId}-dashboard` as DashboardSlug;
}
