import { useApp } from '@/lib/context';
import { isRouteAllowed, getRoleConfig } from '@/lib/permissions';
import type { UserRole } from '@/lib/db-types';

export function usePermissions() {
  const { currentUser } = useApp();
  const role = currentUser?.role as UserRole | undefined;

  const isSuperAdmin = role === 'super_admin';
  const isOrgAdmin = role === 'org_admin';
  const canManagePlatform = isSuperAdmin;
  const canManageOrg = isSuperAdmin || isOrgAdmin;
  const canViewCrossOrg = isSuperAdmin;
  const canEditBranding = isSuperAdmin || isOrgAdmin;

  const canEditClinical = role === 'doctor' || role === 'clinical_officer' || isSuperAdmin;
  const canViewClinical = role === 'doctor' || role === 'clinical_officer' || role === 'nurse' || isSuperAdmin;
  const canRegisterPatients = role === 'doctor' || role === 'clinical_officer' || role === 'nurse' || role === 'front_desk' || role === 'boma_health_worker' || isSuperAdmin;
  const canDispense = role === 'pharmacist' || isSuperAdmin;
  const canEnterLabResults = role === 'lab_tech' || isSuperAdmin;
  const canManageUsers = role === 'government' || isSuperAdmin || isOrgAdmin;
  const isGovernment = role === 'government';

  const canAccess = (path: string): boolean => {
    if (!role) return false;
    return isRouteAllowed(role, path);
  };

  const roleConfig = role ? getRoleConfig(role) : null;

  return {
    role,
    roleConfig,
    isSuperAdmin,
    isOrgAdmin,
    canManagePlatform,
    canManageOrg,
    canViewCrossOrg,
    canEditBranding,
    canEditClinical,
    canViewClinical,
    canRegisterPatients,
    canDispense,
    canEnterLabResults,
    canManageUsers,
    isGovernment,
    canAccess,
  };
}
