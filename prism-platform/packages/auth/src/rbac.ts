// ──────────────────────────────────────────
// Role-Based Access Control Utilities
// ──────────────────────────────────────────

import type { UserRole } from './types';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  store: 1,
  'campus-hiring': 1,
  qa: 2,
  finance: 2,
  hr: 3,
  training: 3,
  operations: 3,
  admin: 4,
  editor: 5,
};

export function validateRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  return userPermissions.includes(requiredPermission);
}
