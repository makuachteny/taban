/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for immunization-service.ts
 * Covers CRUD, stats, defaulter tracking, and vaccine coverage.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getAllImmunizations,
  getByPatient,
  getByFacility,
  createImmunization,
  updateImmunization,
  deleteImmunization,
  getImmunizationStats,
  getDefaulters,
  getVaccineCoverage,
} from '@/lib/services/immunization-service';

const makeImmData = (overrides: Record<string, unknown> = {}) => ({
  patientId: 'child-001',
  patientName: 'Baby Achol',
  gender: 'Female' as const,
  dateOfBirth: '2024-06-01',
  vaccine: 'BCG',
  doseNumber: 1,
  dateGiven: '2024-06-15',
  nextDueDate: '2024-08-15',
  facilityId: 'hosp-001',
  facilityName: 'Juba Teaching Hospital',
  state: 'Central Equatoria',
  administeredBy: 'Nurse Akech',
  batchNumber: 'BCG-2024-001',
  site: 'left arm' as const,
  adverseReaction: false,
  status: 'completed' as const,
  ...overrides,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('immunization-service', () => {
  test('getAllImmunizations returns empty initially', async () => {
    const results = await getAllImmunizations();
    expect(results).toEqual([]);
  });

  test('createImmunization creates record with correct fields', async () => {
    const imm = await createImmunization(makeImmData());

    expect(imm._id).toMatch(/^imm-/);
    expect(imm.type).toBe('immunization');
    expect(imm.vaccine).toBe('BCG');
    expect(imm.patientName).toBe('Baby Achol');
    expect(imm.createdAt).toBeDefined();
    expect(imm._rev).toBeDefined();
  });

  test('getByPatient filters correctly', async () => {
    await createImmunization(makeImmData({ patientId: 'child-001' }));
    await createImmunization(makeImmData({ patientId: 'child-002', patientName: 'Baby Kuol' }));
    await createImmunization(makeImmData({ patientId: 'child-001', vaccine: 'OPV', doseNumber: 0 }));

    const child1 = await getByPatient('child-001');
    const child2 = await getByPatient('child-002');
    expect(child1).toHaveLength(2);
    expect(child2).toHaveLength(1);
  });

  test('getByFacility filters correctly', async () => {
    await createImmunization(makeImmData({ facilityId: 'hosp-001' }));
    await createImmunization(makeImmData({ facilityId: 'hosp-002', facilityName: 'Wau State Hospital' }));

    const fac1 = await getByFacility('hosp-001');
    const fac2 = await getByFacility('hosp-002');
    expect(fac1).toHaveLength(1);
    expect(fac2).toHaveLength(1);
  });

  test('updateImmunization updates record', async () => {
    const imm = await createImmunization(makeImmData());
    const updated = await updateImmunization(imm._id, { adverseReaction: true, adverseReactionDetails: 'Mild swelling' });

    expect(updated).not.toBeNull();
    expect(updated!.adverseReaction).toBe(true);
    expect(updated!.adverseReactionDetails).toBe('Mild swelling');
    expect(updated!.vaccine).toBe('BCG');
  });

  test('updateImmunization returns null for non-existent id', async () => {
    const result = await updateImmunization('imm-nonexistent', { status: 'overdue' });
    expect(result).toBeNull();
  });

  test('deleteImmunization removes record', async () => {
    const imm = await createImmunization(makeImmData());
    const deleted = await deleteImmunization(imm._id);
    expect(deleted).toBe(true);

    const all = await getAllImmunizations();
    expect(all).toHaveLength(0);
  });

  test('deleteImmunization returns false for non-existent id', async () => {
    const deleted = await deleteImmunization('imm-nonexistent');
    expect(deleted).toBe(false);
  });

  test('getImmunizationStats returns correct counts', async () => {
    // Child A: BCG completed, Penta3 completed, Measles1 completed => fully immunized
    await createImmunization(makeImmData({ patientId: 'child-A', vaccine: 'BCG', doseNumber: 1, status: 'completed' }));
    await createImmunization(makeImmData({ patientId: 'child-A', vaccine: 'Penta', doseNumber: 3, status: 'completed' }));
    await createImmunization(makeImmData({ patientId: 'child-A', vaccine: 'Measles', doseNumber: 1, status: 'completed' }));

    // Child B: BCG completed only, one scheduled, one overdue
    await createImmunization(makeImmData({ patientId: 'child-B', vaccine: 'BCG', doseNumber: 1, status: 'completed' }));
    await createImmunization(makeImmData({ patientId: 'child-B', vaccine: 'Penta', doseNumber: 1, status: 'scheduled' }));
    await createImmunization(makeImmData({ patientId: 'child-B', vaccine: 'OPV', doseNumber: 1, status: 'overdue' }));

    const stats = await getImmunizationStats();
    expect(stats.totalVaccinations).toBe(4); // completed count
    expect(stats.totalChildren).toBe(2);
    expect(stats.fullyImmunized).toBe(1); // only child-A
    expect(stats.overdue).toBe(1);
    expect(stats.scheduled).toBe(1);
    expect(stats.coverageRate).toBe(50); // 1/2 * 100
  });

  test('getDefaulters identifies overdue records', async () => {
    // Past due date => should be a defaulter
    const pastDate = '2024-01-01';
    await createImmunization(makeImmData({
      patientId: 'child-D',
      vaccine: 'Penta',
      doseNumber: 2,
      status: 'overdue',
      dateGiven: pastDate,
      nextDueDate: pastDate,
      dateOfBirth: '2023-06-01',
    }));

    // Completed => should not be a defaulter
    await createImmunization(makeImmData({
      patientId: 'child-E',
      vaccine: 'BCG',
      doseNumber: 1,
      status: 'completed',
      dateGiven: '2024-06-15',
      nextDueDate: '2024-08-15',
    }));

    const defaulters = await getDefaulters();
    expect(defaulters.length).toBeGreaterThanOrEqual(1);
    expect(defaulters.some(d => d.patientId === 'child-D')).toBe(true);
    expect(defaulters.some(d => d.patientId === 'child-E')).toBe(false);
  });

  test('getDefaulters assigns urgency based on days overdue', async () => {
    const longOverdue = new Date();
    longOverdue.setDate(longOverdue.getDate() - 60);

    await createImmunization(makeImmData({
      patientId: 'child-F',
      vaccine: 'Measles',
      doseNumber: 1,
      status: 'overdue',
      dateGiven: longOverdue.toISOString().slice(0, 10),
      nextDueDate: longOverdue.toISOString().slice(0, 10),
      dateOfBirth: '2023-01-01',
    }));

    const defaulters = await getDefaulters();
    const childF = defaulters.find(d => d.patientId === 'child-F');
    expect(childF).toBeDefined();
    expect(childF!.urgency).toBe('critical'); // >30 days
    expect(childF!.daysOverdue).toBeGreaterThan(30);
  });

  test('getVaccineCoverage calculates percentages', async () => {
    // Two children, both have BCG completed, only one has Measles
    await createImmunization(makeImmData({ patientId: 'child-X', vaccine: 'BCG', status: 'completed' }));
    await createImmunization(makeImmData({ patientId: 'child-Y', vaccine: 'BCG', status: 'completed' }));
    await createImmunization(makeImmData({ patientId: 'child-X', vaccine: 'Measles', doseNumber: 1, status: 'completed' }));

    const coverage = await getVaccineCoverage();
    const bcg = coverage.find(c => c.vaccine === 'BCG');
    const measles = coverage.find(c => c.vaccine === 'Measles');

    expect(bcg).toBeDefined();
    expect(bcg!.count).toBe(2);
    expect(bcg!.percentage).toBe(100); // 2/2

    expect(measles).toBeDefined();
    expect(measles!.count).toBe(1);
    expect(measles!.percentage).toBe(50); // 1/2
  });
});
