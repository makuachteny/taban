import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth-token';

// Rate limiting: track failed attempts in memory
const failedAttempts: Record<string, { count: number; lockedUntil: number }> = {};

// Dummy hash for constant-time comparison when user is not found (prevents timing attacks)
const DUMMY_HASH = '$2a$12$LJ3m4ys3Lg3JqC0fP4R3xOVTgFGAEuOMBlas3ShOaJqQufTO7HNxK';

// Periodic cleanup of expired rate-limit entries to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();
function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const key of Object.keys(failedAttempts)) {
    if (failedAttempts[key].lockedUntil > 0 && failedAttempts[key].lockedUntil < now) {
      delete failedAttempts[key];
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body with explicit error handling
    let body: { username?: string; password?: string; hospitalId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { username, password, hospitalId } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Validate username format - reject invalid characters instead of silently stripping
    const trimmedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(trimmedUsername)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const sanitizedUsername = trimmedUsername;

    // Periodic cleanup of expired entries
    cleanupExpiredEntries();

    // Rate limiting check
    const attempt = failedAttempts[sanitizedUsername];
    if (attempt && attempt.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      return NextResponse.json({ error: `Account temporarily locked. Try again in ${remainingMinutes} minutes.` }, { status: 429 });
    }

    // Dynamic imports for browser-only modules (PouchDB, bcryptjs)
    const { usersDB } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/auth');
    const { logAudit } = await import('@/lib/services/audit-service');
    type UserDoc = import('@/lib/db-types').UserDoc;

    // Look up user
    const db = usersDB();
    let user: UserDoc | null = null;
    try {
      user = await db.get(`user-${sanitizedUsername}`) as UserDoc;
    } catch {
      // User not found — will still run bcrypt below for constant-time behavior
    }

    // Always run password verification to prevent timing-based username enumeration
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const valid = await verifyPassword(password, hashToCompare);

    // If user not found, the password check result doesn't matter
    if (!user || !valid) {
      // Track failed attempt
      if (!failedAttempts[sanitizedUsername]) {
        failedAttempts[sanitizedUsername] = { count: 0, lockedUntil: 0 };
      }
      failedAttempts[sanitizedUsername].count++;
      if (failedAttempts[sanitizedUsername].count >= 5) {
        failedAttempts[sanitizedUsername].lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      await logAudit('login_failed', user?._id, sanitizedUsername, 'Invalid credentials', false);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if account is active — use same generic error message
    if (!user.isActive) {
      await logAudit('login_failed', user._id, sanitizedUsername, 'Account disabled', false);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check hospital assignment — super_admin, org_admin, government bypass
    const ROLES_WITHOUT_HOSPITAL = ['super_admin', 'org_admin', 'government'];
    if (!ROLES_WITHOUT_HOSPITAL.includes(user.role) && hospitalId && user.hospitalId && user.hospitalId !== hospitalId) {
      await logAudit('login_failed', user._id, sanitizedUsername, 'Hospital mismatch', false);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Clear failed attempts
    delete failedAttempts[sanitizedUsername];

    // Create JWT
    const token = await createToken({
      _id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      hospitalId: user.hospitalId,
      orgId: user.orgId,
    });

    await logAudit('login_success', user._id, user.username, 'Login successful', true);

    const response = NextResponse.json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospitalName,
        orgId: user.orgId,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('taban-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
