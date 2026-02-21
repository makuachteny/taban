/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for birth-service.ts
 * Covers CRUD operations, facility/state filtering, and birth statistics.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getAllBirths,
  getBirthsByFacility,
  getBirthsByState,
  createBirth,
  updateBirth,
  deleteBirth,
  getBirthStats,
} from '@/lib/services/birth-service';

const makeBirthData = (overrides: Record<string, unknown> = {}) => ({
  childFirstName: 'Akech',
  childSurname: 'Deng',
  childGender: 'Female' as const,
  dateOfBirth: new Date().toISOString().slice(0, 10), // today for thisMonth/thisYear tests
  placeOfBirth: 'Juba Teaching Hospital',
  facilityId: 'hosp-001',
  facilityName: 'Juba Teaching Hospital',
  motherName: 'Achol Mabior',
  motherAge: 28,
  motherNationality: 'South Sudanese',
  fatherName: 'Deng Kuol',
  fatherNationality: 'South Sudanese',
  birthWeight: 3200,
  birthType: 'single' as const,
  deliveryType: 'normal' as const,
  attendedBy: 'midwife',
  registeredBy: 'Nurse Akech',
  state: 'Central Equatoria',
  county: 'Juba',
  certificateNumber: 'CERT-001',
  ...overrides,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('birth-service', () => {
  test('getAllBirths returns empty initially', async () => {
    const births = await getAllBirths();
    expect(births).toEqual([]);
  });

  test('createBirth creates record with correct fields', async () => {
    const birth = await createBirth(makeBirthData());

    expect(birth._id).toMatch(/^birth-/);
    expect(birth.type).toBe('birth');
    expect(birth.childFirstName).toBe('Akech');
    expect(birth.childGender).toBe('Female');
    expect(birth.birthWeight).toBe(3200);
    expect(birth.createdAt).toBeDefined();
    expect(birth._rev).toBeDefined();
  });

  test('getBirthsByFacility filters correctly', async () => {
    await createBirth(makeBirthData({ facilityId: 'hosp-001' }));
    await createBirth(makeBirthData({ facilityId: 'hosp-002', facilityName: 'Wau State Hospital' }));
    await createBirth(makeBirthData({ facilityId: 'hosp-001', childFirstName: 'Nyabol' }));

    const fac1 = await getBirthsByFacility('hosp-001');
    const fac2 = await getBirthsByFacility('hosp-002');
    expect(fac1).toHaveLength(2);
    expect(fac2).toHaveLength(1);
  });

  test('getBirthsByState filters correctly', async () => {
    await createBirth(makeBirthData({ state: 'Central Equatoria' }));
    await createBirth(makeBirthData({ state: 'Western Bahr el Ghazal' }));

    const ce = await getBirthsByState('Central Equatoria');
    const wbg = await getBirthsByState('Western Bahr el Ghazal');
    expect(ce).toHaveLength(1);
    expect(wbg).toHaveLength(1);
  });

  test('updateBirth updates record', async () => {
    const birth = await createBirth(makeBirthData());
    const updated = await updateBirth(birth._id, { birthWeight: 3500 });

    expect(updated).not.toBeNull();
    expect(updated!.birthWeight).toBe(3500);
    expect(updated!.childFirstName).toBe('Akech');
  });

  test('updateBirth returns null for non-existent id', async () => {
    const result = await updateBirth('birth-nonexistent', { birthWeight: 3500 });
    expect(result).toBeNull();
  });

  test('deleteBirth removes record', async () => {
    const birth = await createBirth(makeBirthData());
    const deleted = await deleteBirth(birth._id);
    expect(deleted).toBe(true);

    const all = await getAllBirths();
    expect(all).toHaveLength(0);
  });

  test('deleteBirth returns false for non-existent id', async () => {
    const deleted = await deleteBirth('birth-nonexistent');
    expect(deleted).toBe(false);
  });

  test('getBirthStats calculates correctly', async () => {
    const today = new Date().toISOString().slice(0, 10);

    await createBirth(makeBirthData({
      childGender: 'Male',
      deliveryType: 'normal',
      dateOfBirth: today,
      state: 'Central Equatoria',
    }));
    await createBirth(makeBirthData({
      childGender: 'Female',
      deliveryType: 'caesarean',
      dateOfBirth: today,
      state: 'Central Equatoria',
    }));
    await createBirth(makeBirthData({
      childGender: 'Male',
      deliveryType: 'assisted',
      dateOfBirth: '2020-01-01', // old date, not in this month/year
      state: 'Upper Nile',
    }));

    const stats = await getBirthStats();
    expect(stats.total).toBe(3);
    expect(stats.thisMonth).toBe(2);
    expect(stats.thisYear).toBe(2);
    expect(stats.byGender.male).toBe(2);
    expect(stats.byGender.female).toBe(1);
    expect(stats.byDeliveryType.normal).toBe(1);
    expect(stats.byDeliveryType.caesarean).toBe(1);
    expect(stats.byDeliveryType.assisted).toBe(1);
    expect(stats.byState['Central Equatoria']).toBe(2);
    expect(stats.byState['Upper Nile']).toBe(1);
  });
});
