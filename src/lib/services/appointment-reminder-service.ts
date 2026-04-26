import { appointmentsDB } from '../db';
import type { AppointmentDoc } from '../db-types';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';
import { logAudit } from './audit-service';

export async function getUpcomingReminders(daysAhead?: number, facilityId?: string, scope?: DataScope): Promise<AppointmentDoc[]> {
  /* istanbul ignore next -- defensive default */
  const effectiveDays = daysAhead ?? 1;
  const db = appointmentsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as AppointmentDoc)
    .filter(d => d && d.type === 'appointment');

  const today = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + effectiveDays);
  const futureDate = future.toISOString().slice(0, 10);

  const upcoming = all.filter(a =>
    a.appointmentDate >= today &&
    a.appointmentDate <= futureDate &&
    a.status !== 'cancelled' &&
    a.status !== 'completed' &&
    a.status !== 'no_show' &&
    !a.reminderSent &&
    (!facilityId || a.facilityId === facilityId)
  );

  return scope ? filterByScope(upcoming, scope) : upcoming;
}

export async function generateReminderMessages(appointments: AppointmentDoc[]): Promise<{
  appointmentId: string;
  patientPhone?: string;
  patientName: string;
  message: string;
  channel: 'sms' | 'app' | 'both';
}[]> {
  const messages = appointments.map(apt => ({
    appointmentId: apt._id,
    patientPhone: apt.patientPhone,
    patientName: apt.patientName,
    message: generateReminderMessage(apt),
    channel: apt.reminderChannel || 'both' as const,
  }));

  logAudit('GENERATE_REMINDERS', undefined, undefined,
    `Generated ${messages.length} appointment reminders`
  ).catch(() => {});

  return messages;
}

export async function getOverdueAppointments(facilityId?: string): Promise<AppointmentDoc[]> {
  const db = appointmentsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as AppointmentDoc)
    .filter(d => d && d.type === 'appointment');

  const today = new Date().toISOString().slice(0, 10);

  return all.filter(a =>
    a.appointmentDate < today &&
    a.status !== 'completed' &&
    a.status !== 'no_show' &&
    a.status !== 'cancelled' &&
    (!facilityId || a.facilityId === facilityId)
  );
}

export async function getNoShowStats(
  dateRange: { start: string; end: string },
  facilityId?: string
): Promise<{
  totalAppointments: number;
  noShowCount: number;
  noShowRate: number;
  completedCount: number;
  cancelledCount: number;
  byDepartment: Record<string, { total: number; noShow: number; rate: number }>;
}> {
  const db = appointmentsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as AppointmentDoc)
    .filter(d => d && d.type === 'appointment');

  const filtered = all.filter(a =>
    a.appointmentDate >= dateRange.start &&
    a.appointmentDate <= dateRange.end &&
    (!facilityId || a.facilityId === facilityId)
  );

  const noShows = filtered.filter(a => a.status === 'no_show');
  const completed = filtered.filter(a => a.status === 'completed');
  const cancelled = filtered.filter(a => a.status === 'cancelled');

  const byDepartment: Record<string, { total: number; noShow: number; rate: number }> = {};
  for (const dept of new Set(filtered.map(a => a.department))) {
    const deptAppts = filtered.filter(a => a.department === dept);
    const deptNoShows = deptAppts.filter(a => a.status === 'no_show');
    /* istanbul ignore next -- defensive: deptAppts always has entries when iterated */
    const deptRate = deptAppts.length > 0 ? Math.round((deptNoShows.length / deptAppts.length) * 100) : 0;
    byDepartment[dept] = {
      total: deptAppts.length,
      noShow: deptNoShows.length,
      rate: deptRate,
    };
  }

  return {
    totalAppointments: filtered.length,
    noShowCount: noShows.length,
    noShowRate: filtered.length > 0 ? Math.round((noShows.length / filtered.length) * 100) : 0,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    byDepartment,
  };
}

export async function getMissedFollowUps(facilityId?: string): Promise<AppointmentDoc[]> {
  const db = appointmentsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as AppointmentDoc)
    .filter(d => d && d.type === 'appointment');

  const today = new Date().toISOString().slice(0, 10);

  return all.filter(a =>
    a.appointmentType === 'follow_up' &&
    a.appointmentDate < today &&
    a.status === 'no_show' &&
    (!facilityId || a.facilityId === facilityId)
  );
}

// ===== Helper Functions =====

function generateReminderMessage(appointment: AppointmentDoc): string {
  const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `Reminder: You have an appointment on ${appointmentDate} at ${appointment.appointmentTime} with ${appointment.providerName} at ${appointment.facilityName}. Please arrive 10 minutes early. Reply CONFIRM to confirm or CANCEL to cancel.`;
}
