/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for medical-record-service.ts
 * Covers CRUD operations and validation for clinical consultation records.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-medrec-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getRecordsByPatient,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getRecentRecords,
} from '@/lib/services/medical-record-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

function validRecord(overrides: Record<string, unknown> = {}) {
  return {
    patientId: 'patient-001',
    hospitalId: 'hosp-001',
    hospitalName: 'Taban Hospital',
    visitDate: '2026-04-01',
    consultedAt: '2026-04-01T10:00:00Z',
    visitType: 'outpatient',
    providerName: 'Dr. Kuol',
    providerRole: 'doctor',
    department: 'General Medicine',
    chiefComplaint: 'Persistent fever for 3 days',
    historyOfPresentIllness: 'Patient reports intermittent high fever with chills',
    vitalSigns: { temperature: 39.2, pulse: 88, respiratoryRate: 20, systolicBP: 120, diastolicBP: 80, oxygenSaturation: 97 },
    diagnoses: [{ name: 'Suspected malaria', icd10Code: '1F40', severity: 'moderate' }],
    prescriptions: [],
    labResults: [],
    treatmentPlan: 'Artesunate + Amodiaquine',
    syncStatus: 'pending',
    ...overrides,
  };
}

describe('Medical Record Service', () => {
  test('creates a medical record with valid data', async () => {
    const rec = await createMedicalRecord(validRecord() as any);
    expect(rec._id).toMatch(/^rec-/);
    expect(rec.type).toBe('medical_record');
    expect(rec.patientId).toBe('patient-001');
    expect(rec.chiefComplaint).toBe('Persistent fever for 3 days');
    expect(rec.createdAt).toBeDefined();
  });

  test('rejects record with missing chief complaint', async () => {
    await expect(
      createMedicalRecord(validRecord({ chiefComplaint: '' }) as any)
    ).rejects.toThrow();
  });

  test('rejects record with missing patientId', async () => {
    await expect(
      createMedicalRecord(validRecord({ patientId: '' }) as any)
    ).rejects.toThrow();
  });

  test('retrieves records by patient sorted by date', async () => {
    await createMedicalRecord(validRecord({
      consultedAt: '2026-01-15T08:00:00Z',
      chiefComplaint: 'Cough for 1 week',
    }) as any);
    await createMedicalRecord(validRecord({
      consultedAt: '2026-03-20T14:00:00Z',
      chiefComplaint: 'Follow-up for malaria',
    }) as any);
    await createMedicalRecord(validRecord({
      patientId: 'patient-002',
      consultedAt: '2026-02-10T11:00:00Z',
      chiefComplaint: 'Headache',
    }) as any);

    const records = await getRecordsByPatient('patient-001');
    expect(records).toHaveLength(2);
    // Most recent first
    expect(records[0].chiefComplaint).toBe('Follow-up for malaria');
    expect(records[1].chiefComplaint).toBe('Cough for 1 week');
  });

  test('returns empty array for patient with no records', async () => {
    const records = await getRecordsByPatient('nonexistent');
    expect(records).toEqual([]);
  });

  test('updates a medical record', async () => {
    const rec = await createMedicalRecord(validRecord() as any);
    const updated = await updateMedicalRecord(rec._id, {
      treatmentPlan: 'IV Artesunate followed by ACT',
    });
    expect(updated).not.toBeNull();
    expect(updated!.treatmentPlan).toBe('IV Artesunate followed by ACT');
    expect(updated!.patientId).toBe('patient-001');
  });

  test('update returns null for nonexistent record', async () => {
    const result = await updateMedicalRecord('nonexistent', { treatmentPlan: 'test' });
    expect(result).toBeNull();
  });

  test('deletes a medical record', async () => {
    const rec = await createMedicalRecord(validRecord() as any);
    const deleted = await deleteMedicalRecord(rec._id);
    expect(deleted).toBe(true);

    const records = await getRecordsByPatient('patient-001');
    expect(records).toHaveLength(0);
  });

  test('delete returns false for nonexistent record', async () => {
    const result = await deleteMedicalRecord('nonexistent');
    expect(result).toBe(false);
  });

  test('getRecentRecords returns across patients with limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createMedicalRecord(validRecord({
        patientId: `patient-${i}`,
        consultedAt: `2026-04-0${i + 1}T10:00:00Z`,
        chiefComplaint: `Complaint ${i}`,
      }) as any);
    }

    const recent = await getRecentRecords(3);
    expect(recent).toHaveLength(3);
  });
});
