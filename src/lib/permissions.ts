import type { UserRole } from './db-types';
import {
  LayoutDashboard, Users, FileText, ArrowRightLeft, FlaskConical,
  Pill, Activity, BarChart3, Building2, MessageSquare, Baby, Skull,
  Heart, Database, Download, ClipboardCheck, Syringe, HeartPulse, Globe,
  Bug, Home, Shield, Palette, CreditCard, Settings, Calendar, Video, Scan, type LucideIcon,
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
      '/appointments', '/telehealth',
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
      '/hospitals', '/reports', '/settings', '/my-facility',
      '/appointments',
    ],
    navItems: [
      { href: '/org-admin', label: 'Org Dashboard', icon: LayoutDashboard, section: 'ORGANIZATION' },
      { href: '/org-admin/users', label: 'Manage Users', icon: Users, section: 'ORGANIZATION' },
      { href: '/org-admin/hospitals', label: 'Facilities', icon: Building2, section: 'ORGANIZATION' },
      { href: '/org-admin/branding', label: 'Branding', icon: Palette, section: 'ORGANIZATION' },
      { href: '/org-admin/analytics', label: 'Analytics', icon: BarChart3, section: 'ORGANIZATION' },
      { href: '/org-admin/settings', label: 'Settings', icon: Settings, section: 'ORGANIZATION' },
      { href: '/hospitals', label: 'Hospital Network', icon: Building2, section: 'OVERVIEW' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'OVERVIEW' },
      { href: '/appointments', label: 'Appointments', icon: Calendar, section: 'OVERVIEW' },
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
      '/epidemic-intelligence', '/mch-analytics', '/my-facility',
      '/appointments', '/telehealth',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/consultation', label: 'Consultation', icon: FileText, section: 'CLINICAL' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'CLINICAL' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'CLINICAL' },
      { href: '/appointments', label: 'Appointments', icon: Calendar, section: 'CLINICAL' },
      { href: '/telehealth', label: 'Telehealth', icon: Video, section: 'CLINICAL' },
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
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
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
      '/surveillance', '/settings', '/my-facility',
      '/appointments',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/consultation', label: 'Consultation', icon: FileText, section: 'CLINICAL' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'CLINICAL' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'CLINICAL' },
      { href: '/appointments', label: 'Appointments', icon: Calendar, section: 'CLINICAL' },
      { href: '/lab', label: 'Laboratory', icon: FlaskConical, section: 'SERVICES' },
      { href: '/pharmacy', label: 'Pharmacy', icon: Pill, section: 'SERVICES' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'VITAL EVENTS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'VITAL EVENTS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'VITAL EVENTS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'VITAL EVENTS' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'MORE' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
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
      '/lab', '/immunizations', '/anc', '/births', '/deaths',
      '/settings', '/my-facility', '/appointments',
    ],
    navItems: [
      { href: '/dashboard/nurse', label: 'Nurse Station', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/appointments', label: 'Appointments', icon: Calendar, section: 'CLINICAL' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'CLINICAL' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'CARE PROGRAMS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'CARE PROGRAMS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'VITAL EVENTS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'VITAL EVENTS' },
      { href: '/lab', label: 'Lab Results', icon: FlaskConical, section: 'MORE' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
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
      '/dashboard/front-desk', '/patients', '/referrals', '/messages', '/settings', '/my-facility',
      '/appointments',
    ],
    navItems: [
      { href: '/dashboard/front-desk', label: 'Reception', icon: LayoutDashboard },
      { href: '/patients', label: 'Patient Registry', icon: Users },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/appointments', label: 'Appointments', icon: Calendar },
      { href: '/my-facility', label: 'My Facility', icon: Building2 },
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
      '/immunizations', '/anc', '/births', '/deaths',
    ],
    navItems: [
      { href: '/dashboard/boma', label: 'My Community', icon: Home, section: 'COMMUNITY' },
      { href: '/patients', label: 'Households', icon: Users, section: 'COMMUNITY' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'HEALTH' },
      { href: '/anc', label: 'ANC Visits', icon: HeartPulse, section: 'HEALTH' },
      { href: '/births', label: 'Births', icon: Baby, section: 'HEALTH' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'HEALTH' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
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
      { href: '/dashboard/payam', label: 'Payam Overview', icon: LayoutDashboard, section: 'OVERSIGHT' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'OVERSIGHT' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'OVERSIGHT' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'OVERSIGHT' },
      { href: '/dashboard/boma', label: 'BHW Dashboard', icon: Home, section: 'SUPERVISION' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'HEALTH PROGRAMS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'HEALTH PROGRAMS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'HEALTH PROGRAMS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'HEALTH PROGRAMS' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'MONITORING' },
      { href: '/facility-assessments', label: 'Facility Checks', icon: ClipboardCheck, section: 'MONITORING' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'MONITORING' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'MORE' },
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
      '/epidemic-intelligence', '/mch-analytics', '/appointments',
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

  data_entry_clerk: {
    label: 'Data Entry Clerk',
    defaultDashboard: '/dashboard/data-entry',
    allowedRoutes: [
      '/dashboard/data-entry', '/facility-assessments',
      '/data-quality', '/immunizations', '/anc',
      '/births', '/deaths', '/vital-statistics',
      '/messages', '/settings', '/my-facility',
    ],
    navItems: [
      { href: '/dashboard/data-entry', label: 'Data Entry', icon: LayoutDashboard, section: 'FACILITY DATA' },
      { href: '/facility-assessments', label: 'Facility Assessments', icon: ClipboardCheck, section: 'FACILITY DATA' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'FACILITY DATA' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'FACILITY DATA' },
      { href: '/vital-statistics', label: 'Vital Statistics', icon: Heart, section: 'RECORDS' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'RECORDS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'RECORDS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'RECORDS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'RECORDS' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#0891B2',
    gradientFrom: '#0E7490',
    gradientTo: '#0891B2',
    badgeLabel: 'Data Entry',
  },

  medical_superintendent: {
    label: 'Medical Superintendent',
    defaultDashboard: '/dashboard',
    allowedRoutes: [
      '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
      '/epidemic-intelligence', '/mch-analytics', '/my-facility',
      '/appointments', '/telehealth', '/facility-assessments', '/data-quality',
    ],
    navItems: [
      { href: '/dashboard', label: 'Hospital Dashboard', icon: LayoutDashboard, section: 'ADMINISTRATION' },
      { href: '/hospitals', label: 'Hospital Network', icon: Building2, section: 'ADMINISTRATION' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'ADMINISTRATION' },
      { href: '/facility-assessments', label: 'Facility Assessments', icon: ClipboardCheck, section: 'ADMINISTRATION' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'ADMINISTRATION' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/consultation', label: 'Consultation', icon: FileText, section: 'CLINICAL' },
      { href: '/referrals', label: 'Referrals', icon: ArrowRightLeft, section: 'CLINICAL' },
      { href: '/appointments', label: 'Appointments', icon: Calendar, section: 'CLINICAL' },
      { href: '/telehealth', label: 'Telehealth', icon: Video, section: 'CLINICAL' },
      { href: '/lab', label: 'Laboratory', icon: FlaskConical, section: 'SERVICES' },
      { href: '/pharmacy', label: 'Pharmacy', icon: Pill, section: 'SERVICES' },
      { href: '/epidemic-intelligence', label: 'Epidemic Intel', icon: Bug, section: 'INTELLIGENCE' },
      { href: '/mch-analytics', label: 'MCH Analytics', icon: HeartPulse, section: 'INTELLIGENCE' },
      { href: '/surveillance', label: 'Surveillance', icon: Activity, section: 'INTELLIGENCE' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'MORE' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#1E40AF',
    gradientFrom: '#1E3A8A',
    gradientTo: '#1E40AF',
    badgeLabel: 'Med. Supt.',
  },

  hrio: {
    label: 'Health Records Officer',
    defaultDashboard: '/dashboard/data-entry',
    allowedRoutes: [
      '/dashboard/data-entry', '/patients', '/facility-assessments',
      '/data-quality', '/reports', '/vital-statistics',
      '/immunizations', '/anc', '/births', '/deaths',
      '/hospitals', '/messages', '/settings', '/my-facility',
    ],
    navItems: [
      { href: '/dashboard/data-entry', label: 'Records Dashboard', icon: LayoutDashboard, section: 'RECORDS' },
      { href: '/patients', label: 'Patient Registry', icon: Users, section: 'RECORDS' },
      { href: '/data-quality', label: 'Data Quality', icon: Database, section: 'RECORDS' },
      { href: '/reports', label: 'Reports', icon: BarChart3, section: 'RECORDS' },
      { href: '/vital-statistics', label: 'Vital Statistics', icon: Heart, section: 'VITAL EVENTS' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'VITAL EVENTS' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'VITAL EVENTS' },
      { href: '/births', label: 'Births', icon: Baby, section: 'VITAL EVENTS' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'VITAL EVENTS' },
      { href: '/facility-assessments', label: 'Facility Assessments', icon: ClipboardCheck, section: 'GOVERNANCE' },
      { href: '/hospitals', label: 'Facility Network', icon: Building2, section: 'GOVERNANCE' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
    ],
    color: '#0F766E',
    gradientFrom: '#115E59',
    gradientTo: '#0F766E',
    badgeLabel: 'HRIO',
  },

  community_health_volunteer: {
    label: 'Community Health Volunteer',
    defaultDashboard: '/dashboard/boma',
    allowedRoutes: [
      '/dashboard/boma', '/patients', '/messages',
      '/immunizations', '/anc', '/births', '/deaths',
    ],
    navItems: [
      { href: '/dashboard/boma', label: 'My Community', icon: Home, section: 'COMMUNITY' },
      { href: '/patients', label: 'Households', icon: Users, section: 'COMMUNITY' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'HEALTH' },
      { href: '/anc', label: 'ANC Visits', icon: HeartPulse, section: 'HEALTH' },
      { href: '/births', label: 'Births', icon: Baby, section: 'HEALTH' },
      { href: '/deaths', label: 'Deaths', icon: Skull, section: 'HEALTH' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
    ],
    color: '#16A34A',
    gradientFrom: '#15803D',
    gradientTo: '#16A34A',
    badgeLabel: 'CHV',
  },

  nutritionist: {
    label: 'Nutritionist',
    defaultDashboard: '/dashboard',
    allowedRoutes: [
      '/dashboard', '/patients', '/messages', '/anc',
      '/immunizations', '/mch-analytics', '/settings', '/my-facility',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CLINICAL' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'CLINICAL' },
      { href: '/anc', label: 'Antenatal Care', icon: HeartPulse, section: 'PROGRAMS' },
      { href: '/immunizations', label: 'Immunizations', icon: Syringe, section: 'PROGRAMS' },
      { href: '/mch-analytics', label: 'MCH Analytics', icon: HeartPulse, section: 'PROGRAMS' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
    ],
    color: '#EA580C',
    gradientFrom: '#C2410C',
    gradientTo: '#EA580C',
    badgeLabel: 'Nutritionist',
  },

  radiologist: {
    label: 'Radiologist',
    defaultDashboard: '/dashboard',
    allowedRoutes: [
      '/dashboard', '/patients', '/lab', '/messages', '/settings', '/my-facility',
    ],
    navItems: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'IMAGING' },
      { href: '/patients', label: 'Patients', icon: Users, section: 'IMAGING' },
      { href: '/lab', label: 'Lab & Imaging', icon: Scan, section: 'IMAGING' },
      { href: '/messages', label: 'Messages', icon: MessageSquare, section: 'MORE' },
      { href: '/my-facility', label: 'My Facility', icon: Building2, section: 'MORE' },
    ],
    color: '#7C3AED',
    gradientFrom: '#6D28D9',
    gradientTo: '#7C3AED',
    badgeLabel: 'Radiology',
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

const PRIVATE_SECTOR_ROLES: UserRole[] = ['org_admin', 'doctor', 'clinical_officer', 'nurse', 'lab_tech', 'pharmacist', 'front_desk', 'data_entry_clerk', 'medical_superintendent', 'hrio', 'nutritionist', 'radiologist'];
const ALL_ROLES: UserRole[] = ['super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse', 'lab_tech', 'pharmacist', 'front_desk', 'government', 'boma_health_worker', 'payam_supervisor', 'data_entry_clerk', 'medical_superintendent', 'hrio', 'community_health_volunteer', 'nutritionist', 'radiologist'];

export function getAvailableRoles(orgType: 'public' | 'private', isSuperAdmin = false): UserRole[] {
  if (isSuperAdmin) return ALL_ROLES;
  if (orgType === 'private') return PRIVATE_SECTOR_ROLES;
  return ALL_ROLES;
}
