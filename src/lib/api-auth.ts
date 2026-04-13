/**
 * Shared server-side authentication helper for API routes.
 * Extracts and verifies the JWT from the request cookie, returning the
 * authenticated user payload or null.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth-token';
import type { UserRole } from './db-types';

export interface AuthPayload {
  sub: string;
  username: string;
  role: UserRole;
  name: string;
  hospitalId?: string;
  orgId?: string;
}

/**
 * Verify the JWT cookie on the incoming request.
 * Returns the decoded payload or null if missing/invalid.
 */
export async function getAuthPayload(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get('taban-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as AuthPayload;
}

/**
 * Convenience: return a 401 JSON response.
 */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Convenience: return a 403 JSON response.
 */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Check whether the authenticated user has one of the required roles.
 */
export function hasRole(auth: AuthPayload, allowed: UserRole[]): boolean {
  return allowed.includes(auth.role);
}

/**
 * Standard error response for validation errors.
 */
export function validationError(errors: Record<string, string>) {
  return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 });
}

/**
 * Standard error response for server errors.
 */
export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}
