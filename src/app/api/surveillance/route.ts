/**
 * API: /api/surveillance
 * GET  — List disease alerts (all, active)
 * POST — Create alert, update alert, or delete alert
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent', 'government', 'payam_supervisor',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'medical_superintendent', 'government',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const { getAllAlerts, getActiveAlerts } = await import('@/lib/services/surveillance-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const scope = buildScopeFromAuth(auth);
    const filter = request.nextUrl.searchParams.get('filter');

    let alerts;
    if (filter === 'active') {
      alerts = await getActiveAlerts();
    } else {
      alerts = await getAllAlerts(scope);
    }

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('[API /surveillance GET]', err);
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

    // Delete alert
    if (action === 'delete' && body.alertId) {
      const { deleteAlert } = await import('@/lib/services/surveillance-service');
      const deleted = await deleteAlert(body.alertId as string);
      if (!deleted) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      return NextResponse.json({ deleted: true });
    }

    // Update alert
    if (action === 'update' && body.alertId) {
      const { updateAlert } = await import('@/lib/services/surveillance-service');
      const updated = await updateAlert(body.alertId as string, {
        diseaseName: body.diseaseName as string | undefined,
        description: body.description as string | undefined,
        alertLevel: body.alertLevel as string | undefined,
        location: body.location as string | undefined,
        reportedBy: body.reportedBy as string | undefined,
        reportDate: body.reportDate as string | undefined,
        affectedCount: body.affectedCount !== undefined ? Number(body.affectedCount) : undefined,
      } as any);
      if (!updated) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      return NextResponse.json({ alert: updated });
    }

    // Create new alert
    if (!body.diseaseName || !body.description) {
      return NextResponse.json(
        { error: 'diseaseName and description are required' },
        { status: 400 }
      );
    }

    const { createAlert } = await import('@/lib/services/surveillance-service');
    const alert = await createAlert({
      diseaseName: body.diseaseName as string,
      description: body.description as string,
      alertLevel: body.alertLevel as string,
      location: body.location as string,
      reportedBy: body.reportedBy as string,
      reportDate: body.reportDate as string,
      affectedCount: body.affectedCount !== undefined ? Number(body.affectedCount) : 0,
      hospitalId: body.hospitalId as string | undefined,
      orgId: body.orgId as string | undefined,
    } as any);

    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    console.error('[API /surveillance POST]', err);
    return serverError();
  }
}
