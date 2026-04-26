/**
 * API: /api/deaths
 * GET  — List deaths (supports ?patientId=xxx, ?state=xxx, ?facilityId=xxx)
 * POST — Register a new death
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
  'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllDeaths, getDeathsByFacility, getDeathStats,
    } = await import('@/lib/services/death-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const state = url.searchParams.get('state');
    const facilityId = url.searchParams.get('facilityId');
    const includeStats = url.searchParams.get('stats') === 'true';

    let deaths;
    if (patientId) {
      // patientId query — get all deaths and filter
      const all = await getAllDeaths();
      deaths = all.filter(d => d.patientId === patientId);
    } else if (state) {
      // state query — get all deaths and filter
      const all = await getAllDeaths();
      deaths = all.filter(d => d.state === state);
    } else if (facilityId) {
      // facility query
      deaths = await getDeathsByFacility(facilityId);
    } else {
      // default: all deaths with scope
      const scope = buildScopeFromAuth(auth);
      deaths = await getAllDeaths(scope);
    }

    const response: Record<string, unknown> = { deaths, total: deaths.length };

    if (includeStats) {
      const scope = buildScopeFromAuth(auth);
      response.stats = await getDeathStats(scope);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[API /deaths GET]', err);
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
    if (!body.deceasedFirstName || !body.deceasedSurname || !body.dateOfDeath) {
      return NextResponse.json(
        { error: 'deceasedFirstName, deceasedSurname, and dateOfDeath are required' },
        { status: 400 }
      );
    }

    // Inject auth context
    body.registeredBy = body.registeredBy || auth.sub;
    body.registeredByName = body.registeredByName || auth.name;
    if (!body.facilityId && auth.hospitalId) body.facilityId = auth.hospitalId;
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;

    const { createDeath } = await import('@/lib/services/death-service');
    const death = await createDeath(body as Parameters<typeof createDeath>[0]);

    return NextResponse.json({ death }, { status: 201 });
  } catch (err) {
    console.error('[API /deaths POST]', err);
    return serverError();
  }
}
