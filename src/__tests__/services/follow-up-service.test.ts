/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for follow-up-service.ts
 * Covers community follow-up CRUD, status tracking, and outcome statistics.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-fu-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createFollowUp,
  getAllFollowUps,
  getFollowUpsByWorker,
  getFollowUpsByPatient,
  getPendingFollowUps,
  updateFollowUp,
  getFollowUpStats,
} from '@/lib/services/follow-up-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function validFollowUp(overrides: Record<string, unknown> = {}) {
  return {
    patientId: 'patient-001',
    patientName: 'Deng Mabior',
    geocodeId: 'BOMA-GUD3-HH042',
    assignedWorker: 'bhw-001',
    assignedWorkerName: 'Mary Ayen',
    status: 'active' as const,
    condition: 'Malaria treatment follow-up',
    facilityLevel: 'boma' as const,
    scheduledDate: tomorrow,
    state: 'Central Equatoria',
    county: 'Juba',
    ...overrides,
  };
}

describe('Follow-Up Service', () => {
  test('creates a follow-up record', async () => {
    const fu = await createFollowUp(validFollowUp() as any);
    expect(fu._id).toMatch(/^followup-/);
    expect(fu.type).toBe('follow_up');
    expect(fu.status).toBe('active');
    expect(fu.condition).toBe('Malaria treatment follow-up');
  });

  test('retrieves all follow-ups sorted by scheduled date', async () => {
    await createFollowUp(validFollowUp({ scheduledDate: '2026-04-20' }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      scheduledDate: '2026-04-15',
    }) as any);

    const all = await getAllFollowUps();
    expect(all).toHaveLength(2);
    // Sorted by scheduledDate ascending (earliest first)
    expect(all[0].scheduledDate).toBe('2026-04-15');
    expect(all[1].scheduledDate).toBe('2026-04-20');
  });

  test('retrieves follow-ups by worker', async () => {
    await createFollowUp(validFollowUp() as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      assignedWorker: 'bhw-002', assignedWorkerName: 'James',
    }) as any);

    const worker1 = await getFollowUpsByWorker('bhw-001');
    expect(worker1).toHaveLength(1);
    expect(worker1[0].assignedWorkerName).toBe('Mary Ayen');
  });

  test('retrieves follow-ups by patient', async () => {
    await createFollowUp(validFollowUp() as any);
    await createFollowUp(validFollowUp({
      condition: 'Diarrhoea follow-up',
      scheduledDate: '2026-05-01',
    }) as any);

    const patient1 = await getFollowUpsByPatient('patient-001');
    expect(patient1).toHaveLength(2);
  });

  test('getPendingFollowUps returns active and missed', async () => {
    await createFollowUp(validFollowUp({ status: 'active' }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      status: 'missed',
    }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-003', patientName: 'Nyabol',
      status: 'completed',
    }) as any);

    const pending = await getPendingFollowUps();
    expect(pending).toHaveLength(2);
  });

  test('getPendingFollowUps filters by worker', async () => {
    await createFollowUp(validFollowUp({ status: 'active' }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      assignedWorker: 'bhw-002', assignedWorkerName: 'James',
      status: 'active',
    }) as any);

    const bhw1Pending = await getPendingFollowUps('bhw-001');
    expect(bhw1Pending).toHaveLength(1);
  });

  test('updates a follow-up', async () => {
    const fu = await createFollowUp(validFollowUp() as any);
    const updated = await updateFollowUp(fu._id, {
      status: 'completed',
      outcome: 'recovered',
      completedDate: new Date().toISOString().slice(0, 10),
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('completed');
    expect(updated!.outcome).toBe('recovered');
    expect(updated!.completedDate).toBeDefined();
  });

  test('update returns null for nonexistent follow-up', async () => {
    const result = await updateFollowUp('nonexistent', { status: 'completed' });
    expect(result).toBeNull();
  });

  test('marks follow-up as missed', async () => {
    const fu = await createFollowUp(validFollowUp() as any);
    const missed = await updateFollowUp(fu._id, { status: 'missed' });
    expect(missed).not.toBeNull();
    expect(missed!.status).toBe('missed');
  });

  test('marks follow-up as lost to follow-up', async () => {
    const fu = await createFollowUp(validFollowUp() as any);
    const lost = await updateFollowUp(fu._id, { status: 'lost_to_followup' });
    expect(lost).not.toBeNull();
    expect(lost!.status).toBe('lost_to_followup');
  });

  test('getFollowUpStats returns correct counts', async () => {
    await createFollowUp(validFollowUp({ status: 'active' }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      status: 'completed', outcome: 'recovered',
    }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-003', patientName: 'Nyabol',
      status: 'completed', outcome: 'died',
    }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-004', patientName: 'Kuol',
      status: 'missed',
    }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-005', patientName: 'Garang',
      status: 'lost_to_followup',
    }) as any);

    const stats = await getFollowUpStats();
    expect(stats.total).toBe(5);
    expect(stats.active).toBe(1);
    expect(stats.completed).toBe(2);
    expect(stats.missed).toBe(1);
    expect(stats.lostToFollowUp).toBe(1);
    expect(stats.recovered).toBe(1);
    expect(stats.died).toBe(1);
  });

  test('getFollowUpStats can filter by worker', async () => {
    await createFollowUp(validFollowUp({ status: 'active' }) as any);
    await createFollowUp(validFollowUp({
      patientId: 'patient-002', patientName: 'Achol',
      assignedWorker: 'bhw-002', assignedWorkerName: 'James',
      status: 'completed', outcome: 'recovered',
    }) as any);

    const bhw1Stats = await getFollowUpStats('bhw-001');
    expect(bhw1Stats.total).toBe(1);
    expect(bhw1Stats.active).toBe(1);
  });
});
