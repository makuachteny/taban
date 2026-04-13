/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for ward-service.ts
 * Covers ward creation, bed management, admissions, and discharges.
 */
let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createWard,
  getAllWards,
  getWardById,
  getBedsByWard,
  getAvailableBeds,
  updateBedStatus,
  admitPatient,
  dischargePatient,
  getActiveAdmissions,
  getAdmissionsByPatient,
  getOccupancyStats,
} from '@/lib/services/ward-service';
import { getDB } from '@/lib/db';

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

const makeWardData = (overrides = {}) => ({
  name: 'Male General Ward',
  wardType: 'general_male' as const,
  facilityId: 'hosp-001',
  facilityName: 'Juba Teaching Hospital',
  facilityLevel: 'national' as const,
  floor: 'Ground',
  totalBeds: 20,
  isActive: true,
  orgId: 'org-001',
  ...overrides,
});

async function seedBeds(wardId: string, wardName: string, count: number) {
  const db = getDB('taban_wards');
  const now = new Date().toISOString();
  for (let i = 1; i <= count; i++) {
    await db.put({
      _id: `bed-${wardId}-${String(i).padStart(2, '0')}`,
      type: 'bed',
      bedNumber: `${wardId.slice(-3)}-B${String(i).padStart(2, '0')}`,
      wardId,
      wardName,
      facilityId: 'hosp-001',
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });
  }
}

describe('ward-service', () => {
  // ---- Ward CRUD ----
  test('createWard creates a ward with correct defaults', async () => {
    const ward = await createWard(makeWardData());
    expect(ward._id).toMatch(/^ward-/);
    expect(ward.type).toBe('ward');
    expect(ward.name).toBe('Male General Ward');
    expect(ward.totalBeds).toBe(20);
    expect(ward.occupiedBeds).toBe(0);
    expect(ward.availableBeds).toBe(20);
  });

  test('getAllWards returns created wards', async () => {
    await createWard(makeWardData());
    await createWard(makeWardData({ name: 'Female General Ward', wardType: 'general_female' }));
    const wards = await getAllWards();
    expect(wards).toHaveLength(2);
  });

  test('getWardById retrieves a ward', async () => {
    const created = await createWard(makeWardData());
    const found = await getWardById(created._id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Male General Ward');
  });

  // ---- Bed Management ----
  test('getBedsByWard returns beds for a specific ward', async () => {
    const ward = await createWard(makeWardData());
    await seedBeds(ward._id, ward.name, 5);
    const beds = await getBedsByWard(ward._id);
    expect(beds).toHaveLength(5);
    expect(beds[0].status).toBe('available');
  });

  test('getAvailableBeds only returns available beds', async () => {
    const ward = await createWard(makeWardData());
    await seedBeds(ward._id, ward.name, 3);
    const beds = await getBedsByWard(ward._id);

    // Mark one bed as occupied
    await updateBedStatus(beds[0]._id, 'occupied', 'pat-001', 'Achol Deng');

    const available = await getAvailableBeds(ward._id);
    expect(available).toHaveLength(2);
  });

  test('updateBedStatus clears patient info when set to available', async () => {
    const ward = await createWard(makeWardData());
    await seedBeds(ward._id, ward.name, 1);
    const beds = await getBedsByWard(ward._id);

    await updateBedStatus(beds[0]._id, 'occupied', 'pat-001', 'Achol Deng', 'adm-001');
    const updated = await updateBedStatus(beds[0]._id, 'available');
    expect(updated!.currentPatientId).toBeUndefined();
    expect(updated!.currentPatientName).toBeUndefined();
    expect(updated!.lastCleanedAt).toBeDefined();
  });

  // ---- Admission ----
  test('admitPatient creates an admission record', async () => {
    const ward = await createWard(makeWardData());
    await seedBeds(ward._id, ward.name, 3);
    const beds = await getBedsByWard(ward._id);

    const admission = await admitPatient({
      patientId: 'pat-001',
      patientName: 'Achol Deng',
      hospitalNumber: 'JTH-0001',
      admittingDiagnosis: 'Severe malaria',
      icd11Code: '1F40',
      severity: 'severe',
      admittedBy: 'user-001',
      admittedByName: 'Dr. Wani',
      wardId: ward._id,
      wardName: ward.name,
      bedId: beds[0]._id,
      bedNumber: beds[0].bedNumber,
      facilityId: 'hosp-001',
      facilityName: 'Juba Teaching Hospital',
      facilityLevel: 'national',
      attendingPhysician: 'user-001',
      attendingPhysicianName: 'Dr. Wani',
      state: 'Central Equatoria',
      orgId: 'org-001',
    });

    expect(admission._id).toMatch(/^adm-/);
    expect(admission.status).toBe('admitted');
    expect(admission.admittingDiagnosis).toBe('Severe malaria');
  });

  test('admitPatient marks bed as occupied', async () => {
    const ward = await createWard(makeWardData());
    await seedBeds(ward._id, ward.name, 3);
    const beds = await getBedsByWard(ward._id);

    await admitPatient({
      patientId: 'pat-001',
      patientName: 'Achol Deng',
      admittingDiagnosis: 'Pneumonia',
      severity: 'moderate',
      admittedBy: 'user-001',
      admittedByName: 'Dr. Wani',
      wardId: ward._id,
      wardName: ward.name,
      bedId: beds[0]._id,
      bedNumber: beds[0].bedNumber,
      facilityId: 'hosp-001',
      facilityName: 'Juba Teaching Hospital',
      facilityLevel: 'national',
      attendingPhysician: 'user-001',
      attendingPhysicianName: 'Dr. Wani',
      state: 'Central Equatoria',
    });

    const updatedBeds = await getBedsByWard(ward._id);
    const assignedBed = updatedBeds.find(b => b._id === beds[0]._id);
    expect(assignedBed!.status).toBe('occupied');
    expect(assignedBed!.currentPatientName).toBe('Achol Deng');
  });

  test('getActiveAdmissions returns only admitted patients', async () => {
    const ward = await createWard(makeWardData());

    await admitPatient({
      patientId: 'pat-001',
      patientName: 'Achol Deng',
      admittingDiagnosis: 'Malaria',
      severity: 'moderate',
      admittedBy: 'user-001',
      admittedByName: 'Dr. Wani',
      wardId: ward._id,
      wardName: ward.name,
      facilityId: 'hosp-001',
      facilityName: 'JTH',
      facilityLevel: 'national',
      attendingPhysician: 'user-001',
      attendingPhysicianName: 'Dr. Wani',
      state: 'Central Equatoria',
    });

    const active = await getActiveAdmissions();
    expect(active).toHaveLength(1);
    expect(active[0].patientName).toBe('Achol Deng');
  });

  // ---- Discharge ----
  test('dischargePatient updates status and calculates length of stay', async () => {
    const ward = await createWard(makeWardData());

    const admission = await admitPatient({
      patientId: 'pat-001',
      patientName: 'Achol Deng',
      admittingDiagnosis: 'Typhoid',
      severity: 'moderate',
      admittedBy: 'user-001',
      admittedByName: 'Dr. Wani',
      wardId: ward._id,
      wardName: ward.name,
      facilityId: 'hosp-001',
      facilityName: 'JTH',
      facilityLevel: 'national',
      attendingPhysician: 'user-001',
      attendingPhysicianName: 'Dr. Wani',
      state: 'Central Equatoria',
    });

    const discharged = await dischargePatient(admission._id, {
      dischargeType: 'normal',
      dischargeDiagnosis: 'Typhoid - resolved',
      dischargeSummary: 'Patient recovered well after antibiotic course',
      dischargedBy: 'user-001',
      dischargedByName: 'Dr. Wani',
      followUpRequired: true,
      followUpDate: '2026-04-20',
      followUpInstructions: 'Return for follow-up blood work',
    });

    expect(discharged).not.toBeNull();
    expect(discharged!.status).toBe('discharged');
    expect(discharged!.dischargeDate).toBeDefined();
    expect(discharged!.lengthOfStay).toBeGreaterThanOrEqual(1);
    expect(discharged!.followUpRequired).toBe(true);
  });

  test('getAdmissionsByPatient returns all admissions for a patient', async () => {
    const ward = await createWard(makeWardData());

    await admitPatient({
      patientId: 'pat-001',
      patientName: 'Achol Deng',
      admittingDiagnosis: 'Malaria',
      severity: 'moderate',
      admittedBy: 'user-001',
      admittedByName: 'Dr. Wani',
      wardId: ward._id,
      wardName: ward.name,
      facilityId: 'hosp-001',
      facilityName: 'JTH',
      facilityLevel: 'national',
      attendingPhysician: 'user-001',
      attendingPhysicianName: 'Dr. Wani',
      state: 'Central Equatoria',
    });

    const admissions = await getAdmissionsByPatient('pat-001');
    expect(admissions).toHaveLength(1);
  });

  // ---- Occupancy Stats ----
  test('getOccupancyStats calculates correctly', async () => {
    const ward = await createWard(makeWardData({ totalBeds: 10 }));
    await seedBeds(ward._id, ward.name, 10);
    const beds = await getBedsByWard(ward._id);

    // Occupy 3 beds
    for (let i = 0; i < 3; i++) {
      await updateBedStatus(beds[i]._id, 'occupied', `pat-${i}`, `Patient ${i}`);
    }

    // Update ward occupancy manually (normally done by admitPatient)
    const db = getDB('taban_wards');
    const wardDoc = await db.get(ward._id) as Record<string, unknown>;
    wardDoc.occupiedBeds = 3;
    wardDoc.availableBeds = 7;
    await db.put(wardDoc);

    const stats = await getOccupancyStats('hosp-001');
    expect(stats.totalBeds).toBe(10);
    expect(stats.occupiedBeds).toBe(3);
    expect(stats.availableBeds).toBe(7);
    expect(stats.occupancyRate).toBe(30);
    expect(stats.wardBreakdown).toHaveLength(1);
  });
});
