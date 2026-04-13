/**
 * API: /api/medical-records
 * GET  — List medical records (supports ?patientId=xxx&limit=N)
 * POST — Create a new medical record (consultation)
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

const CREATE_ROLES: UserRole[] = [
  'super_admin', 'doctor', 'clinical_officer', 'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const { getRecordsByPatient, getRecentRecords } = await import('@/lib/services/medical-record-service');
    const { logDataAccess } = await import('@/lib/services/audit-service');

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let records;
    if (patientId) {
      records = await getRecordsByPatient(patientId);
      logDataAccess(auth.sub, auth.name, 'MEDICAL_RECORDS', patientId, 'VIEW').catch(() => {});
    } else {
      records = await getRecentRecords(limit);
    }

    return NextResponse.json({ records, total: records.length });
  } catch (err) {
    console.error('[API /medical-records GET]', err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, CREATE_ROLES)) return forbidden();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sanitizePayload } = await import('@/lib/validation');

    // Sanitize text fields
    const sanitized = sanitizePayload(body);

    // Inject auth context
    sanitized.consultedBy = sanitized.consultedBy || auth.sub;
    sanitized.consultedByName = sanitized.consultedByName || auth.name;
    if (!sanitized.hospitalId && auth.hospitalId) sanitized.hospitalId = auth.hospitalId;
    if (!sanitized.orgId && auth.orgId) sanitized.orgId = auth.orgId;

    const { createMedicalRecord } = await import('@/lib/services/medical-record-service');
    const record = await createMedicalRecord(sanitized as any);

    return NextResponse.json({ record }, { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: err.message, fields: err.fields }, { status: 400 });
    }
    console.error('[API /medical-records POST]', err);
    return serverError();
  }
}
