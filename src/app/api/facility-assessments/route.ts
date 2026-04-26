/**
 * API: /api/facility-assessments
 * GET  — List assessments or get summary
 * POST — Create facility assessment
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
  'super_admin', 'org_admin', 'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const { getAllAssessments, getAssessmentSummary } = await import('@/lib/services/facility-assessment-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const scope = buildScopeFromAuth(auth);
    const url = new URL(request.url);
    const summaryOnly = url.searchParams.get('summary') === 'true';

    if (summaryOnly) {
      const summary = await getAssessmentSummary(scope);
      return NextResponse.json({ summary });
    }

    const assessments = await getAllAssessments(scope);
    return NextResponse.json({ assessments });
  } catch (err) {
    console.error('[API /facility-assessments GET]', err);
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

    // Validate required fields
    if (!body.facilityId || !body.facilityName || body.assessmentDate === undefined) {
      return NextResponse.json(
        { error: 'facilityId, facilityName, and assessmentDate are required' },
        { status: 400 }
      );
    }

    // Ensure org/hospital context
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;
    if (!body.hospitalId && auth.hospitalId) body.hospitalId = auth.hospitalId;

    const { createAssessment } = await import('@/lib/services/facility-assessment-service');
    const assessment = await createAssessment(body as Parameters<typeof createAssessment>[0]);

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    console.error('[API /facility-assessments POST]', err);
    return serverError();
  }
}
