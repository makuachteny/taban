/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for appointment-service.ts
 * Covers scheduling, conflict detection, status transitions, and statistics.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-appt-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createAppointment,
  getAppointmentsByDate,
  getAppointmentsByPatient,
  getAppointmentsByProvider,
  getUpcomingAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentStats,
} from '@/lib/services/appointment-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

function validAppointment(overrides: Record<string, unknown> = {}) {
  return {
    patientId: 'patient-001',
    patientName: 'Achol Deng',
    providerId: 'dr-001',
    providerName: 'Dr. Kuol',
    facilityId: 'hosp-001',
    facilityName: 'Taban Hospital',
    facilityLevel: 'county' as const,
    appointmentDate: tomorrow,
    appointmentTime: '09:00',
    duration: 30,
    appointmentType: 'general' as const,
    priority: 'routine' as const,
    department: 'Outpatient',
    reason: 'Follow-up consultation',
    status: 'scheduled' as const,
    reminderSent: false,
    isRecurring: false,
    bookedBy: 'staff-001',
    bookedByName: 'Front Desk',
    state: 'Central Equatoria',
    ...overrides,
  };
}

describe('Appointment Service', () => {
  test('creates an appointment with valid data', async () => {
    const apt = await createAppointment(validAppointment() as any);
    expect(apt._id).toMatch(/^apt-/);
    expect(apt.type).toBe('appointment');
    expect(apt.patientName).toBe('Achol Deng');
    expect(apt.status).toBe('scheduled');
  });

  test('detects provider scheduling conflicts', async () => {
    await createAppointment(validAppointment() as any);
    // Same provider, same time = conflict
    await expect(
      createAppointment(validAppointment({
        patientId: 'patient-002',
        patientName: 'Nyabol Kuol',
      }) as any)
    ).rejects.toThrow(/conflict/i);
  });

  test('allows non-overlapping appointments for same provider', async () => {
    await createAppointment(validAppointment() as any);
    const apt2 = await createAppointment(validAppointment({
      patientId: 'patient-002',
      patientName: 'Nyabol Kuol',
      appointmentTime: '10:00',
    }) as any);
    expect(apt2._id).toBeDefined();
  });

  test('retrieves appointments by date', async () => {
    await createAppointment(validAppointment() as any);
    await createAppointment(validAppointment({
      patientId: 'patient-002',
      patientName: 'Deng Mabior',
      appointmentTime: '11:00',
      appointmentDate: yesterday,
      providerId: 'dr-002',
    }) as any);

    const tomorrowApts = await getAppointmentsByDate(tomorrow);
    expect(tomorrowApts).toHaveLength(1);
    expect(tomorrowApts[0].patientName).toBe('Achol Deng');
  });

  test('retrieves appointments by patient', async () => {
    await createAppointment(validAppointment() as any);
    await createAppointment(validAppointment({
      appointmentDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
      appointmentTime: '14:00',
      reason: 'Lab results review',
    }) as any);

    const patientApts = await getAppointmentsByPatient('patient-001');
    expect(patientApts).toHaveLength(2);
  });

  test('retrieves appointments by provider', async () => {
    await createAppointment(validAppointment() as any);
    await createAppointment(validAppointment({
      patientId: 'patient-002',
      patientName: 'Nyabol',
      providerId: 'dr-002',
      providerName: 'Dr. Atem',
      appointmentTime: '10:00',
    }) as any);

    const drKuol = await getAppointmentsByProvider('dr-001');
    expect(drKuol).toHaveLength(1);
    expect(drKuol[0].providerName).toBe('Dr. Kuol');
  });

  test('getUpcomingAppointments excludes past', async () => {
    await createAppointment(validAppointment() as any); // future
    await createAppointment(validAppointment({
      patientId: 'patient-002',
      patientName: 'Past Patient',
      appointmentDate: yesterday,
      appointmentTime: '08:00',
      providerId: 'dr-002',
    }) as any);

    const upcoming = await getUpcomingAppointments();
    expect(upcoming.length).toBeGreaterThanOrEqual(1);
    expect(upcoming.every(a => a.appointmentDate >= today)).toBe(true);
  });

  test('updates appointment status to checked_in', async () => {
    const apt = await createAppointment(validAppointment() as any);
    const updated = await updateAppointmentStatus(apt._id, 'checked_in');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('checked_in');
    expect(updated!.checkedInAt).toBeDefined();
  });

  test('updates appointment status to completed', async () => {
    const apt = await createAppointment(validAppointment() as any);
    const updated = await updateAppointmentStatus(apt._id, 'completed');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('completed');
    expect(updated!.completedAt).toBeDefined();
  });

  test('cancels appointment with reason', async () => {
    const apt = await createAppointment(validAppointment() as any);
    const cancelled = await updateAppointmentStatus(apt._id, 'cancelled', {
      cancelledReason: 'Patient requested',
      cancelledBy: 'staff-001',
    });
    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe('cancelled');
  });

  test('reschedules appointment', async () => {
    const apt = await createAppointment(validAppointment() as any);
    const newDate = new Date(Date.now() + 259200000).toISOString().slice(0, 10);
    const rescheduled = await rescheduleAppointment(apt._id, newDate, '15:00');
    expect(rescheduled).not.toBeNull();
    expect(rescheduled!.appointmentDate).toBe(newDate);
    expect(rescheduled!.appointmentTime).toBe('15:00');
    expect(rescheduled!.status).toBe('scheduled');
  });

  test('getAppointmentStats returns correct counts', async () => {
    await createAppointment(validAppointment({
      appointmentDate: today,
      appointmentTime: '08:00',
    }) as any);
    await createAppointment(validAppointment({
      patientId: 'patient-002',
      patientName: 'Deng',
      appointmentDate: today,
      appointmentTime: '09:00',
    }) as any);
    const apt3 = await createAppointment(validAppointment({
      patientId: 'patient-003',
      patientName: 'Nyabol',
      appointmentDate: today,
      appointmentTime: '10:00',
    }) as any);
    await updateAppointmentStatus(apt3._id, 'completed');

    const stats = await getAppointmentStats();
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.todayTotal).toBeGreaterThanOrEqual(3);
    expect(stats.todayCompleted).toBeGreaterThanOrEqual(1);
  });
});
