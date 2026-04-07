import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth-token';

// Edge-compatible route map (no lucide imports)
const ROLE_ROUTES: Record<string, { allowed: string[]; defaultDashboard: string }> = {
  super_admin: {
    allowed: [
      '/admin', '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings',
      '/epidemic-intelligence', '/mch-analytics', '/government',
      '/vital-statistics', '/facility-assessments', '/data-quality',
      '/dhis2-export', '/public-stats', '/appointments', '/telehealth',
    ],
    defaultDashboard: '/admin',
  },
  org_admin: {
    allowed: [
      '/org-admin', '/dashboard', '/patients', '/consultation', '/referrals', '/messages',
      '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths',
      '/surveillance', '/reports', '/hospitals', '/settings', '/my-facility',
      '/appointments', '/telehealth',
    ],
    defaultDashboard: '/org-admin',
  },
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
  boma_health_worker: {
    allowed: ['/dashboard/boma', '/patients', '/messages'],
    defaultDashboard: '/dashboard/boma',
  },
  payam_supervisor: {
    allowed: ['/dashboard/payam', '/dashboard/boma', '/patients', '/consultation', '/referrals', '/messages', '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths', '/surveillance', '/reports', '/facility-assessments', '/data-quality', '/settings', '/appointments'],
    defaultDashboard: '/dashboard/payam',
  },
  government: {
    allowed: ['/government', '/hospitals', '/vital-statistics', '/immunizations', '/anc', '/births', '/deaths', '/facility-assessments', '/data-quality', '/surveillance', '/reports', '/dhis2-export', '/public-stats', '/settings', '/epidemic-intelligence', '/mch-analytics', '/appointments'],
    defaultDashboard: '/government',
  },
};

function isPathAllowed(role: string, pathname: string): boolean {
  const config = ROLE_ROUTES[role];
  if (!config) return false;
  return config.allowed.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/patient-portal') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for auth token on protected routes
  const token = request.cookies.get('taban-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('taban-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // Role-based route enforcement
  const role = payload.role;
  const config = ROLE_ROUTES[role];

  if (config && !isPathAllowed(role, pathname)) {
    return NextResponse.redirect(new URL(config.defaultDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
