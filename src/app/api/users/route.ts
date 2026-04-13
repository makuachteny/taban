/**
 * API: /api/users
 * GET  — List all users (supports filtering by role, hospitalId, etc.)
 * POST — Create user, update user, reset password, or deactivate user
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'pharmacist', 'medical_superintendent',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'org_admin',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const { getAllUsers } = await import('@/lib/services/user-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const scope = buildScopeFromAuth(auth);
    const users = await getAllUsers(scope);

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[API /users GET]', err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, WRITE_ROLES)) return forbidden();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sanitizePayload } = await import('@/lib/validation');
    body = sanitizePayload(body);

    const action = body.action as string;

    // Reset password
    if (action === 'reset_password') {
      if (!body.userId || !body.newPassword) {
        return NextResponse.json(
          { error: 'userId and newPassword are required' },
          { status: 400 }
        );
      }
      const { resetPassword } = await import('@/lib/services/user-service');
      await resetPassword(
        body.userId as string,
        body.newPassword as string,
        auth.sub,
        auth.username
      );
      return NextResponse.json({ success: true });
    }

    // Deactivate user
    if (action === 'deactivate') {
      if (!body.userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }
      const { deactivateUser } = await import('@/lib/services/user-service');
      await deactivateUser(body.userId as string, auth.sub, auth.username);
      return NextResponse.json({ success: true });
    }

    // Update existing user
    if (action === 'update' && body.userId) {
      const { updateUser } = await import('@/lib/services/user-service');
      const updated = await updateUser(
        body.userId as string,
        {
          name: body.name as string | undefined,
          role: body.role as UserRole | undefined,
          hospitalId: body.hospitalId as string | undefined,
          hospitalName: body.hospitalName as string | undefined,
          isActive: body.isActive as boolean | undefined,
        },
        auth.sub,
        auth.username
      );
      return NextResponse.json({ user: updated });
    }

    // Create new user
    if (!body.username || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        { error: 'username, password, name, and role are required' },
        { status: 400 }
      );
    }

    const { createUser } = await import('@/lib/services/user-service');
    const user = await createUser(
      {
        username: body.username as string,
        password: body.password as string,
        name: body.name as string,
        role: body.role as UserRole,
        hospitalId: body.hospitalId as string | undefined,
        hospitalName: body.hospitalName as string | undefined,
        orgId: body.orgId as string | undefined,
      },
      auth.sub,
      auth.username
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('[API /users POST]', err);
    return serverError();
  }
}
