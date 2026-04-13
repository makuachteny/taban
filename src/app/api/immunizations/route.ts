/**
 * API: /api/immunizations
 * GET  — List immunizations (supports ?patientId=xxx, ?facilityId=xxx, ?defaulters=true for coverage stats)
 * POST — Record an immunization
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent', 'front_desk',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent', 'community_health_volunteer',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllImmunizations, getByPatient, getByFacility, getDefaulters,
      getDefaulterStats, getImmunizationStats, getVaccineCoverage, getCoverageByAgeCohort,
    } = await import('@/lib/services/immunization-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const facilityId = url.searchParams.get('facilityId');
    const showDefaulters = url.searchParams.get('defaulters') === 'true';
    const includeStats = url.searchParams.get('stats') === 'true';
    const includeCoverage = url.searchParams.get('coverage') === 'true';
    const includeCohorts = url.searchParams.get('cohorts') === 'true';

    let immunizations;
    if (patientId) {
      immunizations = await getByPatient(patientId);
    } else if (facilityId) {
      immunizations = await getByFacility(facilityId);
    } else if (showDefaulters) {
      // Return defaulters list instead
      const defaulters = await getDefaulters();
      const defaulterStats = await getDefaulterStats();
      return NextResponse.json({ defaulters, defaulterStats, total: defaulters.length });
    } else {
      // default: all with scope
      const scope = buildScopeFromAuth(auth);
      immunizations = await getAllImmunizations(scope);
    }

    const response: Record<string, any> = { immunizations, total: immunizations.length };

    if (includeStats) {
      const scope = buildScopeFromAuth(auth);
      response.stats = await getImmunizationStats(scope);
    }

    if (includeCoverage) {
      const scope = buildScopeFromAuth(auth);
      response.coverage = await getVaccineCoverage(scope);
    }

    if (includeCohorts) {
      const scope = buildScopeFromAuth(auth);
      response.cohorts = await getCoverageByAgeCohort(scope);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[API /immunizations GET]', err);
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
    if (!body.patientId || !body.vaccine || body.doseNumber === undefined) {
      return NextResponse.json(
        { error: 'patientId, vaccine, and doseNumber are required' },
        { status: 400 }
      );
    }

    // Inject auth context
    body.recordedBy = body.recordedBy || auth.sub;
    body.recordedByName = body.recordedByName || auth.name;
    if (!body.facilityId && auth.hospitalId) body.facilityId = auth.hospitalId;
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;

    const { createImmunization } = await import('@/lib/services/immunization-service');
    const immunization = await createImmunization(body as any);

    return NextResponse.json({ immunization }, { status: 201 });
  } catch (err) {
    console.error('[API /immunizations POST]', err);
    return serverError();
  }
}
