/**
 * API: /api/medical-records/[id]
 * GET   — Retrieve a single medical record
 * PATCH — Update a medical record
 * DELETE — Delete a medical record (soft-delete via status, or hard delete)
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
  'super_admin', 'doctor', 'clinical_officer', 'medical_superintendent',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, WRITE_ROLES)) return forbidden();

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Prevent changing immutable fields
    const immutable = ['_id', '_rev', 'type', 'createdAt'];
    for (const key of immutable) {
      delete body[key];
    }

    const { sanitizePayload } = await import('@/lib/validation');
    const sanitized = sanitizePayload(body);

    const { updateMedicalRecord } = await import('@/lib/services/medical-record-service');
    const updated = await updateMedicalRecord(id, sanitized as any);
    if (!updated) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ record: updated });
  } catch (err) {
    console.error('[API /medical-records/[id] PATCH]', err);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, ['super_admin', 'medical_superintendent'])) return forbidden();

    const { id } = await params;
    const { deleteMedicalRecord } = await import('@/lib/services/medical-record-service');
    const { logAudit } = await import('@/lib/services/audit-service');

    const deleted = await deleteMedicalRecord(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    logAudit(
      'DELETE_MEDICAL_RECORD', auth.sub, auth.name,
      `Deleted medical record ${id}`
    ).catch(() => {});

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[API /medical-records/[id] DELETE]', err);
    return serverError();
  }
}
