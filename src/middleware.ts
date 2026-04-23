import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth-token';
import { isTokenRevoked } from './lib/token-blacklist';

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
      '/payments', '/wards', '/equipment', '/hr', '/feedback', '/dashboard/hr',
    ],
    defaultDashboard: '/admin',
  },
  org_admin: {
    allowed: ['/org-admin', '/hospitals', '/reports', '/settings',
              '/my-facility', '/appointments', '/payments',
              '/wards', '/equipment', '/hr', '/feedback', '/dashboard/hr'],
    defaultDashboard: '/org-admin',
  },
  doctor: {
    allowed: ['/dashboard', '/patients', '/consultation', '/referrals',
       '/messages', '/lab', '/pharmacy', '/immunizations', '/anc', '/births',
       '/deaths', '/surveillance', '/reports', '/hospitals', '/settings',
        '/epidemic-intelligence', '/mch-analytics', '/my-facility',
         '/appointments', '/telehealth', '/payments',
         '/wards', '/feedback', '/hr'],
    defaultDashboard: '/dashboard',
  },
  clinical_officer: {
    allowed: ['/dashboard', '/patients', '/consultation', '/referrals',
            '/messages', '/lab', '/pharmacy', '/immunizations', '/anc',
             '/births', '/deaths', '/surveillance', '/settings', '/my-facility',
              '/appointments', '/payments',
              '/wards', '/feedback'],
    defaultDashboard: '/dashboard',
  },
  nurse: {
    allowed: ['/dashboard/nurse', '/patients', '/messages', '/lab',
       '/immunizations', '/anc', '/births', '/deaths', '/settings',
        '/my-facility', '/appointments', '/payments',
        '/wards', '/feedback', '/hr'],
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
    allowed: ['/dashboard/front-desk', '/patients', '/referrals', '/messages',
       '/settings', '/my-facility', '/appointments', '/payments',
       '/wards', '/feedback'],
    defaultDashboard: '/dashboard/front-desk',
  },
  boma_health_worker: {
    allowed: ['/dashboard/boma', '/patients', '/messages', '/immunizations',
       '/anc', '/births', '/deaths'],
    defaultDashboard: '/dashboard/boma',
  },
  payam_supervisor: {
    allowed: ['/dashboard/payam', '/dashboard/boma', '/patients', '/referrals', '/messages', '/immunizations', '/anc', '/births', '/deaths', '/surveillance', '/reports', '/facility-assessments', '/data-quality', '/settings'],
    defaultDashboard: '/dashboard/payam',
  },
  government: {
    allowed: ['/government', '/hospitals', '/vital-statistics', '/immunizations', '/anc', '/births', '/deaths', '/facility-assessments', '/data-quality', '/surveillance', '/reports', '/dhis2-export', '/public-stats', '/settings', '/epidemic-intelligence', '/mch-analytics', '/appointments'],
    defaultDashboard: '/government',
  },
  data_entry_clerk: {
    allowed: ['/dashboard/data-entry', '/facility-assessments', '/data-quality', '/immunizations', '/anc', '/births', '/deaths', '/vital-statistics', '/messages', '/settings', '/my-facility'],
    defaultDashboard: '/dashboard/data-entry',
  },
  medical_superintendent: {
    allowed: ['/dashboard', '/patients', '/consultation', '/referrals', '/messages', '/lab', '/pharmacy', '/immunizations', '/anc', '/births', '/deaths', '/surveillance', '/reports', '/hospitals', '/settings', '/epidemic-intelligence', '/mch-analytics', '/my-facility', '/appointments', '/telehealth', '/facility-assessments', '/data-quality', '/payments', '/wards', '/equipment', '/hr', '/feedback', '/dashboard/hr'],
    defaultDashboard: '/dashboard',
  },
  hrio: {
    allowed: ['/dashboard/hr', '/dashboard/data-entry', '/patients', '/facility-assessments', '/data-quality', '/reports', '/vital-statistics', '/immunizations', '/anc', '/births', '/deaths', '/hospitals', '/messages', '/settings', '/my-facility', '/hr', '/feedback'],
    defaultDashboard: '/dashboard/hr',
  },
  community_health_volunteer: {
    allowed: ['/dashboard/boma', '/patients', '/messages', '/immunizations', '/anc', '/births', '/deaths'],
    defaultDashboard: '/dashboard/boma',
  },
  nutritionist: {
    allowed: ['/dashboard/nutrition', '/patients', '/messages', '/anc', '/immunizations', '/mch-analytics', '/settings', '/my-facility'],
    defaultDashboard: '/dashboard/nutrition',
  },
  radiologist: {
    allowed: ['/dashboard/radiology', '/patients', '/lab', '/messages', '/settings', '/my-facility'],
    defaultDashboard: '/dashboard/radiology',
  },
};

function isPathAllowed(role: string, pathname: string): boolean {
  const config = ROLE_ROUTES[role];
  if (!config) return false;
  return config.allowed.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Structured request logging for operational visibility and audit trails.
 * Logs: timestamp, method, path, user (if authenticated), status, duration.
 * In production, this would feed into a log aggregation service (e.g. ELK, Loki).
 */
function logRequest(
  request: NextRequest,
  response: NextResponse,
  userId?: string,
  role?: string,
  durationMs?: number,
) {
  // Skip noisy static asset requests
  const path = request.nextUrl.pathname;
  if (path.startsWith('/_next') || path === '/favicon.ico') return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path,
    status: response.status || 200,
    userId: userId || 'anonymous',
    role: role || 'none',
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown',
    userAgent: request.headers.get('user-agent')?.slice(0, 100) || '',
    durationMs: durationMs || 0,
  };

  // Use structured JSON logging for machine-parseable logs
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else if (request.method !== 'GET' || path.startsWith('/api/')) {
    // In dev, only log API calls and state-changing requests to reduce noise
    console.log(`[REQ] ${logEntry.method} ${logEntry.path} → ${logEntry.status} (${logEntry.userId}/${logEntry.role}) ${logEntry.durationMs}ms`);
  }
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Static assets — always public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Auth API routes — always public (needed for login/logout flow)
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me'
  ) {
    return NextResponse.next();
  }

  // Patient portal API — uses its own JWT auth (not staff auth)
  if (pathname.startsWith('/api/patient-portal/')) {
    return NextResponse.next();
  }

  // CSRF protection for state-changing API requests
  if (pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      const isProd = process.env.NODE_ENV === 'production';

      // In production, require Origin header for state-changing API calls
      if (isProd && !origin) {
        return NextResponse.json({ error: 'Missing Origin header' }, { status: 403 });
      }

      // Verify Origin matches Host when both are present
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'Invalid Origin' }, { status: 403 });
        }
      }
    }
  }

  // Login page — always public
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Public pages — product, public-stats, patient-portal
  if (
    pathname === '/' ||
    pathname === '/product' ||
    pathname === '/public-stats' ||
    pathname === '/patient-portal'
  ) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const token = request.cookies.get('taban-token')?.value;

  if (!token || isTokenRevoked(token)) {
    // API routes return 401, page routes redirect to login
    if (pathname.startsWith('/api/')) {
      const resp = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      logRequest(request, resp, undefined, undefined, Date.now() - startTime);
      return resp;
    }
    const resp = NextResponse.redirect(new URL('/login', request.url));
    logRequest(request, resp, undefined, undefined, Date.now() - startTime);
    return resp;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('taban-token', '', { maxAge: 0, path: '/' });
    logRequest(request, response, undefined, undefined, Date.now() - startTime);
    return response;
  }

  // Role-based route enforcement
  const role = payload.role;
  const userId = payload.sub;
  const config = ROLE_ROUTES[role];

  if (config && !isPathAllowed(role, pathname)) {
    const resp = NextResponse.redirect(new URL(config.defaultDashboard, request.url));
    logRequest(request, resp, userId, role, Date.now() - startTime);
    return resp;
  }

  const response = NextResponse.next();
  logRequest(request, response, userId, role, Date.now() - startTime);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
