/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for death-service.ts
 * Covers CRUD operations, facility filtering, and death statistics
 * including maternal, under-5, and neonatal death counts.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getAllDeaths,
  getDeathsByFacility,
  createDeath,
  updateDeath,
  deleteDeath,
  getDeathStats,
} from '@/lib/services/death-service';

const makeDeathData = (overrides: Record<string, unknown> = {}) => ({
  deceasedFirstName: 'Mabior',
  deceasedSurname: 'Garang',
  deceasedGender: 'Male' as const,
  dateOfBirth: '1960-01-01',
  dateOfDeath: new Date().toISOString().slice(0, 10),
  ageAtDeath: 65,
  placeOfDeath: 'Juba Teaching Hospital',
  facilityId: 'hosp-001',
  facilityName: 'Juba Teaching Hospital',
  immediateCause: 'Cardiac arrest',
  immediateICD11: 'BC41',
  antecedentCause1: 'Ischemic heart disease',
  antecedentICD11_1: 'BA80',
  antecedentCause2: '',
  antecedentICD11_2: '',
  underlyingCause: 'Hypertension',
  underlyingICD11: 'BA00',
  contributingConditions: 'Diabetes',
  contributingICD11: 'JA60',
  mannerOfDeath: 'natural' as const,
  maternalDeath: false,
  pregnancyRelated: false,
  certifiedBy: 'Dr. Mayen',
  certifierRole: 'doctor',
  state: 'Central Equatoria',
  county: 'Juba',
  certificateNumber: 'DEATH-CERT-001',
  deathNotified: true,
  deathRegistered: true,
  ...overrides,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('death-service', () => {
  test('getAllDeaths returns empty initially', async () => {
    const deaths = await getAllDeaths();
    expect(deaths).toEqual([]);
  });

  test('createDeath creates record with correct fields', async () => {
    const death = await createDeath(makeDeathData());

    expect(death._id).toMatch(/^death-/);
    expect(death.type).toBe('death');
    expect(death.deceasedFirstName).toBe('Mabior');
    expect(death.mannerOfDeath).toBe('natural');
    expect(death.createdAt).toBeDefined();
    expect(death._rev).toBeDefined();
  });

  test('getDeathsByFacility filters correctly', async () => {
    await createDeath(makeDeathData({ facilityId: 'hosp-001' }));
    await createDeath(makeDeathData({ facilityId: 'hosp-002', facilityName: 'Wau State Hospital' }));
    await createDeath(makeDeathData({ facilityId: 'hosp-001', deceasedFirstName: 'Kuol' }));

    const fac1 = await getDeathsByFacility('hosp-001');
    const fac2 = await getDeathsByFacility('hosp-002');
    expect(fac1).toHaveLength(2);
    expect(fac2).toHaveLength(1);
  });

  test('updateDeath updates record', async () => {
    const death = await createDeath(makeDeathData());
    const updated = await updateDeath(death._id, { deathNotified: false });

    expect(updated).not.toBeNull();
    expect(updated!.deathNotified).toBe(false);
    expect(updated!.deceasedFirstName).toBe('Mabior');
  });

  test('updateDeath returns null for non-existent id', async () => {
    const result = await updateDeath('death-nonexistent', { deathNotified: false });
    expect(result).toBeNull();
  });

  test('deleteDeath removes record', async () => {
    const death = await createDeath(makeDeathData());
    const deleted = await deleteDeath(death._id);
    expect(deleted).toBe(true);

    const all = await getAllDeaths();
    expect(all).toHaveLength(0);
  });

  test('deleteDeath returns false for non-existent id', async () => {
    const deleted = await deleteDeath('death-nonexistent');
    expect(deleted).toBe(false);
  });

  test('getDeathStats counts maternal deaths', async () => {
    await createDeath(makeDeathData({
      deceasedGender: 'Female',
      maternalDeath: true,
      pregnancyRelated: true,
      ageAtDeath: 25,
    }));
    await createDeath(makeDeathData({
      deceasedGender: 'Male',
      maternalDeath: false,
      ageAtDeath: 65,
    }));

    const stats = await getDeathStats();
    expect(stats.total).toBe(2);
    expect(stats.maternalDeaths).toBe(1);
  });

  test('getDeathStats counts under-5 deaths', async () => {
    // Under 5
    await createDeath(makeDeathData({
      deceasedFirstName: 'Baby A',
      ageAtDeath: 2,
      dateOfBirth: '2023-01-01',
    }));
    // Neonatal (< 28 days ~= 0.077 years)
    await createDeath(makeDeathData({
      deceasedFirstName: 'Baby B',
      ageAtDeath: 0.02, // about 7 days
      dateOfBirth: '2025-12-20',
    }));
    // Adult
    await createDeath(makeDeathData({
      deceasedFirstName: 'Adult C',
      ageAtDeath: 40,
    }));

    const stats = await getDeathStats();
    expect(stats.total).toBe(3);
    expect(stats.under5Deaths).toBe(2); // Baby A + Baby B
    expect(stats.neonatalDeaths).toBe(1); // only Baby B (age < 0.077)
  });

  test('getDeathStats counts ICD-11 coded deaths and by gender', async () => {
    await createDeath(makeDeathData({
      deceasedGender: 'Male',
      underlyingICD11: 'BA00',
    }));
    await createDeath(makeDeathData({
      deceasedGender: 'Female',
      underlyingICD11: '',
      immediateICD11: '',
    }));

    const stats = await getDeathStats();
    expect(stats.withICD11Code).toBe(1);
    expect(stats.byGender.male).toBe(1);
    expect(stats.byGender.female).toBe(1);
  });
});
