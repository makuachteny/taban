/**
 * API: /api/appointments
 * GET  — List appointments (supports ?date=YYYY-MM-DD&patientId=xxx&providerId=xxx)
 * POST — Create a new appointment
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'front_desk', 'medical_superintendent',
];

const CREATE_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'front_desk', 'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllAppointments, getAppointmentsByDate, getAppointmentsByPatient,
      getAppointmentsByProvider, getTodaysAppointments, getUpcomingAppointments,
      getAppointmentStats,
    } = await import('@/lib/services/appointment-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const patientId = url.searchParams.get('patientId');
    const providerId = url.searchParams.get('providerId');
    const view = url.searchParams.get('view'); // 'today', 'upcoming', 'stats'

    if (view === 'stats') {
      const scope = buildScopeFromAuth(auth);
      const stats = await getAppointmentStats(scope);
      return NextResponse.json(stats);
    }

    if (view === 'today') {
      const scope = buildScopeFromAuth(auth);
      const appointments = await getTodaysAppointments(scope);
      return NextResponse.json({ appointments, total: appointments.length });
    }

    if (view === 'upcoming') {
      const scope = buildScopeFromAuth(auth);
      const appointments = await getUpcomingAppointments(scope);
      return NextResponse.json({ appointments, total: appointments.length });
    }

    let appointments;
    if (date) {
      const scope = buildScopeFromAuth(auth);
      appointments = await getAppointmentsByDate(date, scope);
    } else if (patientId) {
      appointments = await getAppointmentsByPatient(patientId);
    } else if (providerId) {
      appointments = await getAppointmentsByProvider(providerId);
    } else {
      const scope = buildScopeFromAuth(auth);
      appointments = await getAllAppointments(scope);
    }

    return NextResponse.json({ appointments, total: appointments.length });
  } catch (err) {
    console.error('[API /appointments GET]', err);
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

    // Status update action
    if (body.action === 'update_status') {
      if (!body.appointmentId || !body.status) {
        return NextResponse.json(
          { error: 'appointmentId and status are required' },
          { status: 400 }
        );
      }
      const { updateAppointmentStatus } = await import('@/lib/services/appointment-service');
      const result = await updateAppointmentStatus(
        body.appointmentId as string,
        body.status as Parameters<typeof updateAppointmentStatus>[1],
        body.extra as Parameters<typeof updateAppointmentStatus>[2],
      );
      if (!result) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json({ appointment: result });
    }

    // Reschedule action
    if (body.action === 'reschedule') {
      if (!body.appointmentId || !body.newDate || !body.newTime) {
        return NextResponse.json(
          { error: 'appointmentId, newDate, and newTime are required' },
          { status: 400 }
        );
      }
      const { rescheduleAppointment } = await import('@/lib/services/appointment-service');
      const result = await rescheduleAppointment(
        body.appointmentId as string,
        body.newDate as string,
        body.newTime as string,
      );
      if (!result) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json({ appointment: result });
    }

    // Create new appointment
    if (!body.patientId || !body.providerId || !body.appointmentDate || !body.appointmentTime) {
      return NextResponse.json(
        { error: 'patientId, providerId, appointmentDate, and appointmentTime are required' },
        { status: 400 }
      );
    }

    body.bookedBy = body.bookedBy || auth.sub;
    body.bookedByName = body.bookedByName || auth.name;
    if (!body.orgId && auth.orgId) body.orgId = auth.orgId;
    if (!body.facilityId && auth.hospitalId) body.facilityId = auth.hospitalId;

    const { createAppointment } = await import('@/lib/services/appointment-service');
    const appointment = await createAppointment(body as any);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err: any) {
    // Scheduling conflict errors should return 409
    if (err?.message?.toLowerCase()?.includes('conflict')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('[API /appointments POST]', err);
    return serverError();
  }
}
