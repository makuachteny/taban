/**
 * API: /api/follow-ups
 * GET  — List follow-ups (supports ?workerId=xxx&patientId=xxx&view=pending|stats)
 * POST — Create a new follow-up or update status
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent', 'boma_health_worker', 'payam_supervisor',
  'community_health_volunteer',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'doctor', 'clinical_officer', 'nurse',
  'boma_health_worker', 'payam_supervisor', 'community_health_volunteer',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllFollowUps, getFollowUpsByWorker, getFollowUpsByPatient,
      getPendingFollowUps, getFollowUpStats,
    } = await import('@/lib/services/follow-up-service');

    const url = new URL(request.url);
    const workerId = url.searchParams.get('workerId');
    const patientId = url.searchParams.get('patientId');
    const view = url.searchParams.get('view');

    if (view === 'stats') {
      const stats = await getFollowUpStats(workerId || undefined);
      return NextResponse.json(stats);
    }

    if (view === 'pending') {
      const pending = await getPendingFollowUps(workerId || undefined);
      return NextResponse.json({ followUps: pending, total: pending.length });
    }

    let followUps;
    if (workerId) {
      followUps = await getFollowUpsByWorker(workerId);
    } else if (patientId) {
      followUps = await getFollowUpsByPatient(patientId);
    } else {
      followUps = await getAllFollowUps();
    }

    return NextResponse.json({ followUps, total: followUps.length });
  } catch (err) {
    console.error('[API /follow-ups GET]', err);
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

    // Update existing follow-up
    if (body.action === 'update' && body.followUpId) {
      const { updateFollowUp } = await import('@/lib/services/follow-up-service');
      const updates: Record<string, unknown> = {};
      if (body.status) updates.status = body.status;
      if (body.outcome) updates.outcome = body.outcome;
      if (body.completedDate) updates.completedDate = body.completedDate;
      if (body.notes) updates.notes = body.notes;
      const result = await updateFollowUp(body.followUpId as string, updates as any);
      if (!result) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
      return NextResponse.json({ followUp: result });
    }

    // Create new follow-up
    if (!body.patientId || !body.condition || !body.scheduledDate) {
      return NextResponse.json(
        { error: 'patientId, condition, and scheduledDate are required' },
        { status: 400 }
      );
    }

    body.assignedWorker = body.assignedWorker || auth.sub;
    body.assignedWorkerName = body.assignedWorkerName || auth.name;
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;

    const { createFollowUp } = await import('@/lib/services/follow-up-service');
    const followUp = await createFollowUp(body as any);

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (err) {
    console.error('[API /follow-ups POST]', err);
    return serverError();
  }
}
