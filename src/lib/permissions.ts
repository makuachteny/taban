import type { UserRole } from './db-types';
import {
  LayoutDashboard, Users, FileText, ArrowRightLeft, FlaskConical,
  Pill, Activity, BarChart3, Building2, MessageSquare, Baby, Skull,
  Heart, Database, Download, ClipboardCheck, Syringe, HeartPulse, Globe,
  Bug, Home, Shield, Palette, CreditCard, Settings, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: string;
}

export interface RoleConfig {
  label: string;
  defaultDashboard: string;
  allowedRoutes: string[];
  navItems: NavItem[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
  badgeLabel: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    defaultDashboard: '/admin',
    allowedRoutes: [
      '/admin', '/admin/organizations', '/admin/users', '/admin/system',
      '/admin/billing', '/admin/analytics',
      '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
      '/epidemic-intelligence', '/mch-analytics', '/government',
      '/vital-statistics', '/facility-assessments', '/data-quality',
      '/dhis2-export', '/public-stats',
    ],
    navItems: [
      { href: '/admin', label: 'Platform Dashboard', icon: Shield, section: 'PLATFORM' },
      { href: '/admin/organizations', label: 'Organizations', icon: Building2, section: 'PLATFORM' },
      { href: '/admin/users', label: 'All Users', icon: Users, section: 'PLATFORM' },
      { href: '/admin/billing', label: 'Billing', icon: CreditCard, section: 'PLATFORM' },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, section: 'PLATFORM' },
      { href: '/admin/system', label: 'System Config', icon: Settings, section: 'PLATFORM' },
    ],
    color: '#DC2626',
    gradientFrom: '#B91C1C',
    gradientTo: '#DC2626',
    badgeLabel: 'Super Admin',
  },

  org_admin: {
    label: 'Organization Admin',
    defaultDashboard: '/org-admin',
    allowedRoutes: [
      '/org-admin', '/org-admin/users', '/org-admin/hospitals',
      '/org-admin/branding', '/org-admin/settings', '/org-admin/analytics',
      '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
    ],
    navItems: [
      { href: '/org-admin', label: 'Org Dashboard', icon: LayoutDashboard, section: 'ORGANIZATION' },
      { href: '/org-admin/users', label: 'Manage Users', icon: Users, section: 'ORGANIZATION' },
      { href: '/org-admin/hospitals', label: 'Facilities', icon: Building2, section: 'ORGANIZATION' },
      { href: '/org-admin/branding', label: 'Branding', icon: Palette, section: 'ORGANIZATION' },
      { href: '/org-admin/analytics', label: 'Analytics', icon: BarChart3, section: 'ORGANIZATION' },
      { href: '/org-admin/settings', label: 'Settings', icon: Settings, section: 'ORGANIZATION' },
    ],
    color: '#7C3AED',
    gradientFrom: '#6D28D9',
    gradientTo: '#7C3AED',
    badgeLabel: 'Org Admin',
  },

  doctor: {
    label: 'Doctor',
    defaultDashboard: '/dashboard',
    allowedRoutes: [
      '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
      '/epidemic-intelligence', '/mch-analytics',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/consultation', label: 'Consultation', icon: FileText, section: 'CLINICAL' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'CLINICAL' },
      { href: '/lab', label: 'Laboratory', icon: FlaskConical, section: 'SERVICES' },
      { href: '/pharmacy', label: 'Pharmacy', icon: Pill, section: 'SERVICES' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'VITAL EVENTS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'VITAL EVENTS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'VITAL EVENTS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'VITAL EVENTS' },
      { href: '/epidemic-intelligence', label: 'Epidemic Intel', icon: Bug, section: 'INTELLIGENCE' },
      { href: '/mch-analytics', label: 'MCH Analytics', icon: HeartPulse, section: 'INTELLIGENCE' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'INTELLIGENCE' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'MORE' },
      { href: '/hospitals', label: 'Hospital Network', icon: Building2, section: 'MORE' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#2B6FE0',
    gradientFrom: '#0F47AF',
    gradientTo: '#2B6FE0',
    badgeLabel: 'Doctor',
  },

  clinical_officer: {
    label: 'Clinical Officer',
    defaultDashboard: '/dashboard',
    allowedRoutes: [
      '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
      '/epidemic-intelligence', '/mch-analytics',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/consultation', label: 'Consultation', icon: FileText, section: 'CLINICAL' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'CLINICAL' },
      { href: '/lab', label: 'Laboratory', icon: FlaskConical, section: 'SERVICES' },
      { href: '/pharmacy', label: 'Pharmacy', icon: Pill, section: 'SERVICES' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'VITAL EVENTS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'VITAL EVENTS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'VITAL EVENTS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'VITAL EVENTS' },
      { href: '/epidemic-intelligence', label: 'Epidemic Intel', icon: Bug, section: 'INTELLIGENCE' },
      { href: '/mch-analytics', label: 'MCH Analytics', icon: HeartPulse, section: 'INTELLIGENCE' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'INTELLIGENCE' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'MORE' },
      { href: '/hospitals', label: 'Hospital Network', icon: Building2, section: 'MORE' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#8B5CF6',
    gradientFrom: '#6D28D9',
    gradientTo: '#8B5CF6',
    badgeLabel: 'Clinical Officer',
  },

  nurse: {
    label: 'Nurse',
    defaultDashboard: '/dashboard/nurse',
    allowedRoutes: [
      '/dashboard/nurse', '/patients', '/messages',
      '/lab', '/immunizations', '/anc', '/births', '/settings',
    ],
    navItems: [
      { href: '/dashboard/nurse', label: 'Nurse Station', icon: LayoutDashboard },
      { href: '/patients', label: 'Patients', icon: Users },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse },
      { href: '/births', label: 'Births', icon: Baby },
      { href: '/lab', label: 'Lab Results', icon: FlaskConical },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
    color: '#EC4899',
    gradientFrom: '#DB2777',
    gradientTo: '#EC4899',
    badgeLabel: 'Nurse',
  },

  lab_tech: {
    label: 'Lab Technician',
    defaultDashboard: '/dashboard/lab',
    allowedRoutes: [
      '/dashboard/lab', '/lab', '/messages', '/settings',
    ],
    navItems: [
      { href: '/dashboard/lab', label: 'Lab Command Center', icon: LayoutDashboard },
      { href: '/lab', label: 'Lab Orders & Results', icon: FlaskConical },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
    color: '#06B6D4',
    gradientFrom: '#0891B2',
    gradientTo: '#06B6D4',
    badgeLabel: 'Lab Tech',
  },

  pharmacist: {
    label: 'Pharmacist',
    defaultDashboard: '/dashboard/pharmacy',
    allowedRoutes: [
      '/dashboard/pharmacy', '/pharmacy', '/messages', '/settings',
    ],
    navItems: [
      { href: '/dashboard/pharmacy', label: 'Pharmacy Ops', icon: LayoutDashboard },
      { href: '/pharmacy', label: 'Dispensing', icon: Pill },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
    color: '#F59E0B',
    gradientFrom: '#D97706',
    gradientTo: '#F59E0B',
    badgeLabel: 'Pharmacist',
  },

  front_desk: {
    label: 'Front Desk',
    defaultDashboard: '/dashboard/front-desk',
    allowedRoutes: [
      '/dashboard/front-desk', '/patients', '/referrals', '/messages', '/settings',
    ],
    navItems: [
      { href: '/dashboard/front-desk', label: 'Reception', icon: LayoutDashboard },
      { href: '/patients', label: 'Patient Registry', icon: Users },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
    color: '#14B8A6',
    gradientFrom: '#2B6FE0',
    gradientTo: '#14B8A6',
    badgeLabel: 'Front Desk',
  },

  boma_health_worker: {
    label: 'Boma Health Worker',
    defaultDashboard: '/dashboard/boma',
    allowedRoutes: [
      '/dashboard/boma', '/patients', '/messages',
    ],
    navItems: [
      { href: '/dashboard/boma', label: 'My Community', icon: Home },
      { href: '/patients', label: 'Households', icon: Users },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
    color: '#059669',
    gradientFrom: '#047857',
    gradientTo: '#059669',
    badgeLabel: 'BHW',
  },

  payam_supervisor: {
    label: 'Payam Supervisor',
    defaultDashboard: '/dashboard/payam',
    allowedRoutes: [
      '/dashboard/payam', '/dashboard/boma', '/patients', '/referrals', '/messages',
      '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/facility-assessments', '/data-quality',
      '/settings',
    ],
    navItems: [
      { href: '/dashboard/payam', label: 'Payam Overview', icon: LayoutDashboard, section: 'SUPERVISION' },
      { href: '/dashboard/boma', label: 'BHW Dashboard', icon: Home, section: 'SUPERVISION' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'SUPERVISION' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'SUPERVISION' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'HEALTH PROGRAMS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'HEALTH PROGRAMS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'HEALTH PROGRAMS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'HEALTH PROGRAMS' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'MONITORING' },
      { href: '/facility-assessments', label: 'Facility Checks', icon: ClipboardCheck, section: 'MONITORING' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'MONITORING' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'MORE' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#D97706',
    gradientFrom: '#B45309',
    gradientTo: '#D97706',
    badgeLabel: 'Payam Supervisor',
  },

  government: {
    label: 'Government Admin',
    defaultDashboard: '/government',
    allowedRoutes: [
      '/government', '/hospitals', '/vital-statistics', '/immunizations',
      '/anc', '/births', '/deaths', '/facility-assessments', '/data-quality',
      '/surveillance', '/reports', '/dhis2-export', '/public-stats', '/settings',
      '/epidemic-intelligence', '/mch-analytics',
    ],
    navItems: [
      { href: '/government', label: 'National Dashboard', icon: LayoutDashboard, section: 'OVERVIEW' },
      { href: '/hospitals', label: 'Hospital Network', icon: Building2, section: 'OVERVIEW' },
      { href: '/vital-statistics', label: 'Vital Statistics', icon: Heart, section: 'POPULATION HEALTH' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'POPULATION HEALTH' },
      { href: '/anc', label: 'Maternal Health', icon: HeartPulse, section: 'POPULATION HEALTH' },
      { href: '/births', label: 'Births', icon: Baby, section: 'POPULATION HEALTH' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'POPULATION HEALTH' },
      { href: '/epidemic-intelligence', label: 'Epidemic Intelligence', icon: Bug, section: 'INTELLIGENCE' },
      { href: '/mch-analytics', label: 'MCH Analytics', icon: HeartPulse, section: 'INTELLIGENCE' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'INTELLIGENCE' },
      { href: '/facility-assessments', label: 'Facility Assessments', icon: ClipboardCheck, section: 'GOVERNANCE' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'GOVERNANCE' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'GOVERNANCE' },
      { href: '/dhis2-export', label: 'DHIS2 Export', icon: Download, section: 'GOVERNANCE' },
      { href: '/public-stats', label: 'Public Statistics', icon: Globe, section: 'GOVERNANCE' },
    ],
    color: '#2B6FE0',
    gradientFrom: '#078930',
    gradientTo: '#2B6FE0',
    badgeLabel: 'Super Admin',
  },
};

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.doctor;
}

export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  const config = getRoleConfig(role);
  return config.allowedRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

export function getDefaultDashboard(role: UserRole): string {
  return getRoleConfig(role).defaultDashboard;
}

const PRIVATE_SECTOR_ROLES: UserRole[] = ['org_admin', 'doctor', 'clinical_officer', 'nurse', 'lab_tech', 'pharmacist', 'front_desk'];
const ALL_ROLES: UserRole[] = ['super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse', 'lab_tech', 'pharmacist', 'front_desk', 'government', 'boma_health_worker', 'payam_supervisor'];

export function getAvailableRoles(orgType: 'public' | 'private', isSuperAdmin = false): UserRole[] {
  if (isSuperAdmin) return ALL_ROLES;
  if (orgType === 'private') return PRIVATE_SECTOR_ROLES;
  return ALL_ROLES;
}
