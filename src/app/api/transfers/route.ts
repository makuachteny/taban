/**
 * API: /api/transfers
 * GET  — Assemble transfer package for a patient
 * POST — Record an action against an in-flight transfer/referral. Body shape:
 *   { action: 'acknowledge' | 'note' | 'status', referralId: string, ... }
 * Wraps the existing referral-service mutations so receiving facilities can
 * confirm hand-off without coupling the UI to the lower-level CRUD endpoint.
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

    const action = String(body.action || '').toLowerCase();
    const referralId = typeof body.referralId === 'string' ? body.referralId : '';

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }
    if (!referralId) {
      return NextResponse.json({ error: 'referralId is required' }, { status: 400 });
    }

    const svc = await import('@/lib/services/referral-service');

    switch (action) {
      case 'acknowledge': {
        // Receiving facility confirms transfer received → mark accepted.
        const updated = await svc.acceptReferral(referralId);
        if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
        return NextResponse.json({ ok: true, referral: updated });
      }
      case 'status': {
        const status = typeof body.status === 'string' ? body.status : '';
        if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 });
        const updated = await svc.updateReferralStatus(referralId, status as Parameters<typeof svc.updateReferralStatus>[1]);
        if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
        return NextResponse.json({ ok: true, referral: updated });
      }
      case 'note': {
        const notes = typeof body.notes === 'string' ? body.notes : '';
        if (!notes.trim()) return NextResponse.json({ error: 'notes is required' }, { status: 400 });
        const updated = await svc.updateReferralNotes(referralId, notes);
        if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
        return NextResponse.json({ ok: true, referral: updated });
      }
      default:
        return NextResponse.json(
          { error: `Unsupported action "${action}". Supported: acknowledge, status, note.` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('[API /transfers POST]', err);
    return serverError();
  }
}
