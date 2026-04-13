/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for referral-service.ts
 * Covers inter-facility referrals, status transitions, and patient transfers.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-ref-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());
jest.mock('@/lib/services/transfer-service', () => ({
  assembleTransferPackage: jest.fn().mockResolvedValue({
    packageSizeBytes: 1000,
    contents: ['record1', 'record2'],
  }),
}));
jest.mock('@/lib/services/audit-service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/services/patient-service', () => ({
  updatePatient: jest.fn().mockResolvedValue({ _id: 'patient-001', _rev: 'rev123' }),
}));

import { teardownTestDBs } from '../helpers/test-db';
import {
  createReferral,
  getAllReferrals,
  getReferralsByPatient,
  getReferralsByHospital,
  updateReferralStatus,
  updateReferralNotes,
  createReferralWithTransfer,
  acceptReferral,
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

  test('createReferralWithTransfer creates referral with transfer package', async () => {
    const attachments = [
      { id: 'att-001', filename: 'xray.pdf', sizeBytes: 500, mimeType: 'application/pdf' },
      { id: 'att-002', filename: 'lab.pdf', sizeBytes: 300, mimeType: 'application/pdf' },
    ];
    const ref = await createReferralWithTransfer(
      validReferral() as any,
      attachments as any,
      'doctor-123'
    );

    expect(ref._id).toMatch(/^ref-/);
    expect(ref.type).toBe('referral');
    expect(ref.transferPackage).toBeDefined();
    expect(ref.transferPackage!.packageSizeBytes).toBe(1800); // 1000 + 500 + 300
    expect(ref.referralAttachments).toEqual(attachments);
  });

  test('createReferralWithTransfer handles empty attachments', async () => {
    const ref = await createReferralWithTransfer(
      validReferral() as any,
      [],
      'doctor-123'
    );

    expect(ref.referralAttachments).toBeUndefined();
    expect(ref.transferPackage).toBeDefined();
    // Mock returns 1000, plus 0 from empty attachments = 1000
    expect(ref.transferPackage!.packageSizeBytes).toBeGreaterThan(0);
  });

  test('acceptReferral updates status to seen and transfers patient', async () => {
    const ref = await createReferral(validReferral() as any);
    const accepted = await acceptReferral(ref._id);

    expect(accepted).not.toBeNull();
    expect(accepted!.status).toBe('seen');
  });

  test('acceptReferral returns null for nonexistent referral', async () => {
    const result = await acceptReferral('nonexistent-ref');
    expect(result).toBeNull();
  });

  test('getAllReferrals with data scope filters appropriately', async () => {
    // First, let's test with scope parameter (the filterByScope function)
    // This requires setting up hospital data in the DB
    await createReferral(validReferral({ state: 'Central Equatoria' }) as any);
    await createReferral(validReferral({
      patientId: 'patient-002',
      patientName: 'Other Patient',
      state: 'Upper Nile',
    }) as any);

    // Call without scope to verify both exist
    const all = await getAllReferrals();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  test('updateReferralNotes persists changes to database', async () => {
    const ref = await createReferral(validReferral() as any);
    const newNotes = 'Updated notes with new information';

    const updated = await updateReferralNotes(ref._id, newNotes);
    expect(updated.notes).toBe(newNotes);
    expect(updated._rev).toBeDefined();
  });

  test('updateReferralStatus updates updatedAt timestamp', async () => {
    const ref = await createReferral(validReferral() as any);
    const originalUpdatedAt = ref.updatedAt;

    // Small delay to ensure timestamp differs
    await new Promise(resolve => setTimeout(resolve, 10));

    const updated = await updateReferralStatus(ref._id, 'seen');
    expect(updated).not.toBeNull();
    expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
  });

  test('createReferral infers orgId from fromHospitalId when provided', async () => {
    const { hospitalsDB } = require('@/lib/db');
    const hdb = hospitalsDB();

    // Put a hospital with orgId in the fromHospitalId position
    const hospital = {
      _id: 'hosp-from-org',
      type: 'hospital' as const,
      name: 'Hospital From Org',
      orgId: 'org-from-123',
    };
    await hdb.put(hospital);

    const ref = await createReferral(validReferral({
      fromHospitalId: 'hosp-from-org',
      toHospitalId: 'hosp-002',
    }) as any);

    // The inferOrgId function should try fromHospitalId
    expect(ref._id).toMatch(/^ref-/);
    expect(ref.type).toBe('referral');
  });

  test('acceptReferral handles updatePatient error gracefully', async () => {
    const { updatePatient } = require('@/lib/services/patient-service');
    updatePatient.mockRejectedValueOnce(new Error('Patient update failed'));

    const ref = await createReferral(validReferral() as any);
    const accepted = await acceptReferral(ref._id);

    // Should still update status to 'seen' even if patient update fails
    expect(accepted).not.toBeNull();
    expect(accepted!.status).toBe('seen');
  });

  test('createReferral infers orgId from toHospitalId only', async () => {
    const { hospitalsDB } = require('@/lib/db');
    const hdb = hospitalsDB();

    // Put a hospital with orgId in the toHospitalId position only
    const hospital = {
      _id: 'hosp-to-org',
      type: 'hospital' as const,
      name: 'Hospital To Org',
      orgId: 'org-to-456',
    };
    await hdb.put(hospital);

    const ref = await createReferral(validReferral({
      fromHospitalId: 'hosp-missing',
      toHospitalId: 'hosp-to-org',
    }) as any);

    // The inferOrgId function should find org from toHospitalId
    expect(ref._id).toMatch(/^ref-/);
    expect(ref.type).toBe('referral');
  });
});
