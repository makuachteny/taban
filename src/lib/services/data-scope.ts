import type { UserRole } from '../db-types';

export interface DataScope {
  orgId?: string;
  hospitalId?: string;
  role: UserRole;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterByScope<T extends Record<string, any>>(
  docs: T[],
  scope: DataScope
): T[] {
  // Super admin sees everything
  if (scope.role === 'super_admin') return docs;

  // Everyone else is filtered by orgId
  let filtered = docs;
  if (scope.orgId) {
    filtered = filtered.filter(d => d.orgId === scope.orgId);
  }

  // Non-admin roles that have a hospitalId are further scoped
  const ADMIN_ROLES: UserRole[] = ['super_admin', 'org_admin', 'government', 'payam_supervisor'];
  if (!ADMIN_ROLES.includes(scope.role) && scope.hospitalId) {
    filtered = filtered.filter(d => !d.hospitalId || d.hospitalId === scope.hospitalId);
  }

  return filtered;
}
