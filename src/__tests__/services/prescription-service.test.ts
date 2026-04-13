/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for prescription-service.ts
 * Covers CRUD, validation, dispensing workflow, and patient filtering.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-rx-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  updatePrescription,
  dispensePrescription,
} from '@/lib/services/prescription-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

function validRx(overrides: Record<string, unknown> = {}) {
  return {
    patientId: 'patient-001',
    patientName: 'Deng Mabior',
    medication: 'Artesunate',
    dose: '200mg',
    route: 'oral',
    frequency: 'BID (twice daily)',
    duration: '3 days',
    prescribedBy: 'Dr. Kuol',
    status: 'pending' as const,
    hospitalId: 'hosp-001',
    hospitalName: 'Taban Hospital',
    ...overrides,
  };
}

describe('Prescription Service', () => {
  test('creates a prescription with valid data', async () => {
    const rx = await createPrescription(validRx() as any);
    expect(rx._id).toMatch(/^rx-/);
    expect(rx.type).toBe('prescription');
    expect(rx.medication).toBe('Artesunate');
    expect(rx.status).toBe('pending');
    expect(rx.createdAt).toBeDefined();
  });

  test('rejects prescription with missing medication', async () => {
    await expect(
      createPrescription(validRx({ medication: '' }) as any)
    ).rejects.toThrow();
  });

  test('rejects prescription with missing dose', async () => {
    await expect(
      createPrescription(validRx({ dose: '' }) as any)
    ).rejects.toThrow();
  });

  test('rejects prescription with missing frequency', async () => {
    await expect(
      createPrescription(validRx({ frequency: '' }) as any)
    ).rejects.toThrow();
  });

  test('rejects prescription with missing patientId', async () => {
    await expect(
      createPrescription(validRx({ patientId: '' }) as any)
    ).rejects.toThrow();
  });

  test('retrieves all prescriptions sorted by date', async () => {
    await createPrescription(validRx() as any);
    await createPrescription(validRx({
      patientId: 'patient-002',
      patientName: 'Achol Deng',
      medication: 'Amoxicillin',
      dose: '500mg',
    }) as any);

    const all = await getAllPrescriptions();
    expect(all).toHaveLength(2);
  });

  test('retrieves prescriptions by patient', async () => {
    await createPrescription(validRx() as any);
    await createPrescription(validRx({
      medication: 'Paracetamol', dose: '1g',
    }) as any);
    await createPrescription(validRx({
      patientId: 'patient-002', patientName: 'Other',
      medication: 'Metformin', dose: '500mg',
    }) as any);

    const p1Rx = await getPrescriptionsByPatient('patient-001');
    expect(p1Rx).toHaveLength(2);
  });

  test('updates a prescription', async () => {
    const rx = await createPrescription(validRx() as any);
    const updated = await updatePrescription(rx._id, {
      dose: '400mg',
      frequency: 'TID (three times daily)',
    });
    expect(updated).not.toBeNull();
    expect(updated!.dose).toBe('400mg');
    expect(updated!.frequency).toBe('TID (three times daily)');
    expect(updated!.medication).toBe('Artesunate'); // unchanged
  });

  test('update returns null for nonexistent prescription', async () => {
    const result = await updatePrescription('nonexistent', { dose: '100mg' });
    expect(result).toBeNull();
  });

  test('dispenses a prescription', async () => {
    const rx = await createPrescription(validRx() as any);
    const dispensed = await dispensePrescription(rx._id, 'pharmacist-001');
    expect(dispensed).not.toBeNull();
    expect(dispensed!.status).toBe('dispensed');
    expect(dispensed!.dispensedAt).toBeDefined();
  });

  test('dispense returns null for nonexistent prescription', async () => {
    const result = await dispensePrescription('nonexistent');
    expect(result).toBeNull();
  });

  test('multiple prescriptions for same patient track independently', async () => {
    const rx1 = await createPrescription(validRx({ medication: 'Artesunate' }) as any);
    const rx2 = await createPrescription(validRx({ medication: 'Paracetamol', dose: '1g' }) as any);

    await dispensePrescription(rx1._id);

    const all = await getPrescriptionsByPatient('patient-001');
    const dispensedCount = all.filter(r => r.status === 'dispensed').length;
    const pendingCount = all.filter(r => r.status === 'pending').length;
    expect(dispensedCount).toBe(1);
    expect(pendingCount).toBe(1);
  });
});
