/**
 * API: /api/transfers
 * GET  — Assemble transfer package for a patient
 * POST — (placeholder for future transfer management)
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      );
    }

    const { assembleTransferPackage } = await import('@/lib/services/transfer-service');

    const transferPackage = await assembleTransferPackage(patientId, auth.sub);

    return NextResponse.json({ transferPackage });
  } catch (err) {
    console.error('[API /transfers GET]', err);
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

    // Placeholder: implement transfer management actions as needed
    // Future actions: initiate transfer, mark as received, cancel transfer, etc.

    return NextResponse.json(
      { message: 'Transfer management endpoint - implement as needed' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API /transfers POST]', err);
    return serverError();
  }
}
