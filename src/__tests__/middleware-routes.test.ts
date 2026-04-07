/**
 * Tests for middleware route configuration consistency
 * Ensures middleware ROLE_ROUTES stay in sync with permissions.ts
 */
import { ROLE_PERMISSIONS } from '../lib/permissions';
import type { UserRole } from '../lib/db-types';

// Mirror of the middleware route map (must stay in sync)
const MIDDLEWARE_ROLE_ROUTES: Record<string, { allowed: string[]; defaultDashboard: string }> = {
  doctor: {
    allowed: ['/dashboard', '/patients', '/consultation', '/referrals', '/messages', '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths', '/surveillance', '/reports', '/hospitals', '/settings', '/epidemic-intelligence', '/mch-analytics', '/my-facility', '/appointments', '/telehealth'],
    defaultDashboard: '/dashboard',
  },
  clinical_officer: {
    allowed: ['/dashboard', '/patients', '/consultation', '/referrals', '/messages', '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths', '/surveillance', '/reports', '/hospitals', '/settings', '/epidemic-intelligence', '/mch-analytics', '/my-facility', '/appointments', '/telehealth'],
    defaultDashboard: '/dashboard',
  },
  nurse: {
    allowed: ['/dashboard/nurse', '/patients', '/messages', '/lab', '/immunizations', '/anc', '/births', '/settings', '/my-facility', '/appointments'],
    defaultDashboard: '/dashboard/nurse',
  },
  lab_tech: {
    allowed: ['/dashboard/lab', '/lab', '/messages', '/settings'],
    defaultDashboard: '/dashboard/lab',
  },
  pharmacist: {
    allowed: ['/dashboard/pharmacy', '/pharmacy', '/messages', '/settings'],
    defaultDashboard: '/dashboard/pharmacy',
  },
  front_desk: {
    allowed: ['/dashboard/front-desk', '/patients', '/referrals', '/messages', '/settings', '/my-facility', '/appointments'],
    defaultDashboard: '/dashboard/front-desk',
  },
  government: {
    allowed: ['/government', '/hospitals', '/vital-statistics', '/immunizations', '/anc', '/births', '/deaths', '/facility-assessments', '/data-quality', '/surveillance', '/reports', '/dhis2-export', '/public-stats', '/settings', '/epidemic-intelligence', '/mch-analytics', '/appointments'],
    defaultDashboard: '/government',
  },
  data_entry_clerk: {
    allowed: ['/dashboard/data-entry', '/patients', '/facility-assessments', '/data-quality', '/immunizations', '/anc', '/births', '/deaths', '/messages', '/settings', '/my-facility'],
    defaultDashboard: '/dashboard/data-entry',
  },
};

const ALL_ROLES: UserRole[] = ['doctor', 'clinical_officer', 'nurse', 'lab_tech', 'pharmacist', 'front_desk', 'government', 'data_entry_clerk'];

describe('middleware-routes sync with permissions', () => {
  test.each(ALL_ROLES)('defaultDashboard matches for role: %s', (role) => {
    const permConfig = ROLE_PERMISSIONS[role];
    const mwConfig = MIDDLEWARE_ROLE_ROUTES[role];
    expect(mwConfig.defaultDashboard).toBe(permConfig.defaultDashboard);
  });

  test.each(ALL_ROLES)('middleware allows all permission allowedRoutes for role: %s', (role) => {
    const permConfig = ROLE_PERMISSIONS[role];
    const mwConfig = MIDDLEWARE_ROLE_ROUTES[role];
    for (const route of permConfig.allowedRoutes) {
      const isInMiddleware = mwConfig.allowed.some(
        r => route === r || route.startsWith(r + '/')
      );
      expect(isInMiddleware).toBe(true);
    }
  });

  test.each(ALL_ROLES)('all nav items are accessible via middleware for role: %s', (role) => {
    const permConfig = ROLE_PERMISSIONS[role];
    const mwConfig = MIDDLEWARE_ROLE_ROUTES[role];
    for (const item of permConfig.navItems) {
      const isAllowed = mwConfig.allowed.some(
        r => item.href === r || item.href.startsWith(r + '/')
      );
      expect(isAllowed).toBe(true);
    }
  });

  test('all roles in permissions are also in middleware', () => {
    for (const role of ALL_ROLES) {
      expect(MIDDLEWARE_ROLE_ROUTES[role]).toBeDefined();
    }
  });
});
