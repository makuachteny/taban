/**
 * API: /api/births
 * GET  — List births (supports ?motherId=xxx, ?patientId=xxx, ?state=xxx)
 * POST — Register a new birth
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent', 'front_desk', 'hrio',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllBirths, getBirthsByFacility, getBirthsByState, getBirthStats,
    } = await import('@/lib/services/birth-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const url = new URL(request.url);
    const motherId = url.searchParams.get('motherId');
    const patientId = url.searchParams.get('patientId');
    const state = url.searchParams.get('state');
    const includeStats = url.searchParams.get('stats') === 'true';

    let births;
    if (motherId) {
      // motherId query — get all births and filter by motherPatientId
      const all = await getAllBirths();
      births = all.filter(b => b.motherPatientId === motherId);
    } else if (patientId) {
      // patientId query — get all births and filter by child patient
      const all = await getAllBirths();
      births = all.filter(b => b.childPatientId === patientId);
    } else if (state) {
      // state query
      births = await getBirthsByState(state);
    } else {
      // default: all births with scope
      const scope = buildScopeFromAuth(auth);
      births = await getAllBirths(scope);
    }

    const response: Record<string, any> = { births, total: births.length };

    if (includeStats) {
      const scope = buildScopeFromAuth(auth);
      response.stats = await getBirthStats(scope);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[API /births GET]', err);
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
    if (!body.childFirstName || !body.childSurname || !body.motherName || !body.dateOfBirth) {
      return NextResponse.json(
        { error: 'childFirstName, childSurname, motherName, and dateOfBirth are required' },
        { status: 400 }
      );
    }

    // Inject auth context
    body.registeredBy = body.registeredBy || auth.sub;
    body.registeredByName = body.registeredByName || auth.name;
    if (!body.facilityId && auth.hospitalId) body.facilityId = auth.hospitalId;
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;

    const { createBirth } = await import('@/lib/services/birth-service');
    const birth = await createBirth(body as any);

    return NextResponse.json({ birth }, { status: 201 });
  } catch (err) {
    console.error('[API /births POST]', err);
    return serverError();
  }
}
