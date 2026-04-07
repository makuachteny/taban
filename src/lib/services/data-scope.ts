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
  // Super admin and national government see everything
  if (scope.role === 'super_admin' || scope.role === 'government') return docs;

  // Everyone else is filtered by orgId
  let filtered = docs;
  if (scope.orgId) {
    // Allow legacy docs without orgId so reporting stays consistent
    filtered = filtered.filter(d => !d.orgId || d.orgId === scope.orgId);
  }

  // Non-admin roles that have a hospitalId are further scoped
  const ADMIN_ROLES: UserRole[] = ['super_admin', 'org_admin', 'government', 'payam_supervisor'];
  if (!ADMIN_ROLES.includes(scope.role) && scope.hospitalId) {
    const hospId = scope.hospitalId;
    filtered = filtered.filter(d => {
      const matches =
        d.hospitalId === hospId ||
        d.registrationHospital === hospId ||
        d.lastVisitHospital === hospId ||
        d.fromHospitalId === hospId ||
        d.toHospitalId === hospId ||
        d.facilityId === hospId;
      return matches || !d.hospitalId;
    });
  }

  return filtered;
}
