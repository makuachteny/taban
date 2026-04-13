/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for referral-service.ts
 * Covers inter-facility referrals, status transitions, and patient transfers.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-ref-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createReferral,
  getAllReferrals,
  getReferralsByPatient,
  getReferralsByHospital,
  updateReferralStatus,
  updateReferralNotes,
} from '@/lib/services/referral-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

function validReferral(overrides: Record<string, unknown> = {}) {
  return {
    patientId: 'patient-001',
    patientName: 'Deng Mabior',
    fromHospitalId: 'hosp-001',
    fromHospital: 'Gudele PHCC',
    toHospitalId: 'hosp-002',
    toHospital: 'Juba Teaching Hospital',
    referralDate: '2026-04-10',
    reason: 'Complicated fracture requiring surgical intervention',
    urgency: 'urgent' as const,
    department: 'Surgery',
    referringDoctor: 'Dr. Kuol',
    status: 'sent' as const,
    notes: 'Patient fell from tree, open fracture with bone exposure',
    state: 'Central Equatoria',
    ...overrides,
  };
}

describe('Referral Service', () => {
  test('creates a referral', async () => {
    const ref = await createReferral(validReferral() as any);
    expect(ref._id).toMatch(/^ref-/);
    expect(ref.type).toBe('referral');
    expect(ref.patientName).toBe('Deng Mabior');
    expect(ref.status).toBe('sent');
    expect(ref.fromHospital).toBe('Gudele PHCC');
    expect(ref.toHospital).toBe('Juba Teaching Hospital');
  });

  test('retrieves all referrals sorted by date', async () => {
    await createReferral(validReferral({ referralDate: '2026-03-01' }) as any);
    await createReferral(validReferral({
      patientId: 'patient-002',
      patientName: 'Achol Deng',
      referralDate: '2026-04-05',
    }) as any);

    const all = await getAllReferrals();
    expect(all).toHaveLength(2);
    // Most recent first
    expect(all[0].referralDate).toBe('2026-04-05');
  });

  test('retrieves referrals by patient', async () => {
    await createReferral(validReferral() as any);
    await createReferral(validReferral({
      referralDate: '2026-02-15',
      reason: 'Follow-up surgery',
    }) as any);
    await createReferral(validReferral({
      patientId: 'patient-002',
      patientName: 'Other Patient',
    }) as any);

    const patientRefs = await getReferralsByPatient('patient-001');
    expect(patientRefs).toHaveLength(2);
  });

  test('retrieves referrals by hospital (from or to)', async () => {
    await createReferral(validReferral() as any); // from hosp-001 to hosp-002
    await createReferral(validReferral({
      patientId: 'patient-002',
      patientName: 'Ayen',
      fromHospitalId: 'hosp-003',
      fromHospital: 'Munuki PHCC',
      toHospitalId: 'hosp-001',
      toHospital: 'Gudele PHCC',
    }) as any);

    const hosp1Refs = await getReferralsByHospital('hosp-001');
    expect(hosp1Refs).toHaveLength(2);
  });

  test('updates referral status through lifecycle', async () => {
    const ref = await createReferral(validReferral() as any);

    const received = await updateReferralStatus(ref._id, 'received');
    expect(received).not.toBeNull();
    expect(received!.status).toBe('received');

    const seen = await updateReferralStatus(ref._id, 'seen');
    expect(seen).not.toBeNull();
    expect(seen!.status).toBe('seen');

    const completed = await updateReferralStatus(ref._id, 'completed');
    expect(completed).not.toBeNull();
    expect(completed!.status).toBe('completed');
  });

  test('cancels a referral', async () => {
    const ref = await createReferral(validReferral() as any);
    const cancelled = await updateReferralStatus(ref._id, 'cancelled');
    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe('cancelled');
  });

  test('updates referral notes', async () => {
    const ref = await createReferral(validReferral() as any);
    const updated = await updateReferralNotes(ref._id, 'Patient stabilized before transfer. Splint applied.');
    expect(updated.notes).toBe('Patient stabilized before transfer. Splint applied.');
  });

  test('status update returns null for nonexistent referral', async () => {
    const result = await updateReferralStatus('nonexistent', 'received');
    expect(result).toBeNull();
  });
});
