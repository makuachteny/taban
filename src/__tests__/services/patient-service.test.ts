/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for patient-service.ts
 * Covers CRUD operations, search, validation, and geocode ID generation.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getAllPatients,
  getPatientById,
  searchPatients,
  createPatient,
  updatePatient,
  getPatientsByHospital,
  generateGeocodeId,
} from '@/lib/services/patient-service';
import { ValidationError } from '@/lib/validation';

// Minimal valid patient data that passes validatePatientData
const validPatient = () => ({
  firstName: 'Achol',
  middleName: '',
  surname: 'Deng',
  gender: 'Female' as const,
  dateOfBirth: '1995-06-15',
  phone: '+211912345678',
  state: 'Central Equatoria',
  county: 'Juba',
  tribe: 'Dinka',
  primaryLanguage: 'Arabic',
  bloodType: 'O+',
  allergies: [] as string[],
  chronicConditions: [] as string[],
  nokName: 'Deng Mabior',
  nokRelationship: 'Father',
  nokPhone: '+211912345679',
  hospitalNumber: '',
  registrationHospital: 'hosp-001',
  registrationDate: '2025-01-10',
  lastVisitDate: '2025-01-10',
  lastVisitHospital: 'hosp-001',
  isActive: true,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('patient-service', () => {
  // ---- getAllPatients ----
  test('getAllPatients returns empty array initially', async () => {
    const patients = await getAllPatients();
    expect(patients).toEqual([]);
  });

  // ---- createPatient ----
  test('createPatient creates a patient with correct fields', async () => {
    const data = validPatient();
    const patient = await createPatient(data);

    expect(patient._id).toMatch(/^pat-/);
    expect(patient.type).toBe('patient');
    expect(patient.firstName).toBe('Achol');
    expect(patient.surname).toBe('Deng');
    expect(patient.gender).toBe('Female');
    expect(patient.createdAt).toBeDefined();
    expect(patient.updatedAt).toBeDefined();
    expect(patient._rev).toBeDefined();
  });

  test('createPatient validates required fields - throws ValidationError for missing firstName', async () => {
    const data = { ...validPatient(), firstName: '' };
    await expect(createPatient(data)).rejects.toThrow(ValidationError);
  });

  test('createPatient throws ValidationError for missing surname', async () => {
    const data = { ...validPatient(), surname: '' };
    await expect(createPatient(data)).rejects.toThrow(ValidationError);
  });

  test('createPatient throws ValidationError for invalid gender', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = { ...validPatient(), gender: 'other' as any };
    await expect(createPatient(data)).rejects.toThrow(ValidationError);
  });

  test('createPatient throws ValidationError when both dateOfBirth and estimatedAge are missing', async () => {
    const data = { ...validPatient(), dateOfBirth: '' };
    await expect(createPatient(data)).rejects.toThrow(ValidationError);
  });

  test('createPatient auto-generates hospital number', async () => {
    const data = validPatient();
    // Do not supply hospitalNumber
    const patient = await createPatient(data);
    expect(patient.hospitalNumber).toMatch(/^JTH-\d{6}$/);
  });

  test('createPatient preserves explicit hospital number', async () => {
    const data = { ...validPatient(), hospitalNumber: 'CUSTOM-001' };
    const patient = await createPatient(data);
    expect(patient.hospitalNumber).toBe('CUSTOM-001');
  });

  // ---- getPatientById ----
  test('getPatientById finds existing patient', async () => {
    const created = await createPatient(validPatient());
    const found = await getPatientById(created._id);
    expect(found).not.toBeNull();
    expect(found!._id).toBe(created._id);
    expect(found!.firstName).toBe('Achol');
  });

  test('getPatientById returns null for non-existent id', async () => {
    const found = await getPatientById('pat-does-not-exist');
    expect(found).toBeNull();
  });

  // ---- searchPatients ----
  test('searchPatients finds by name', async () => {
    await createPatient(validPatient());
    await createPatient({ ...validPatient(), firstName: 'Nyabol', surname: 'Kuol', phone: '+211912345999', dateOfBirth: '1998-03-10' });

    const results = await searchPatients('Achol');
    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('Achol');
  });

  test('searchPatients finds by hospital number', async () => {
    const patient = await createPatient({ ...validPatient(), hospitalNumber: 'WBG-000123' });
    const results = await searchPatients('WBG-000123');
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe(patient._id);
  });

  test('searchPatients returns empty for no match', async () => {
    await createPatient(validPatient());
    const results = await searchPatients('ZZZZZZ');
    expect(results).toHaveLength(0);
  });

  // ---- updatePatient ----
  test('updatePatient modifies fields', async () => {
    const created = await createPatient(validPatient());
    const updated = await updatePatient(created._id, { phone: '+211999888777' });

    expect(updated).not.toBeNull();
    expect(updated!.phone).toBe('+211999888777');
    expect(updated!.firstName).toBe('Achol');
    // updatedAt should be set (may be same millisecond as created)
    expect(updated!.updatedAt).toBeDefined();
    // _rev should differ from original (proves DB was updated)
    expect(updated!._rev).not.toBe(created._rev);
  });

  test('updatePatient throws for non-existent id', async () => {
    // The service does db.get which throws; updatePatient does not catch
    await expect(updatePatient('pat-nonexistent', { phone: '123' })).rejects.toThrow();
  });

  // ---- getPatientsByHospital ----
  test('getPatientsByHospital filters correctly', async () => {
    await createPatient({ ...validPatient(), registrationHospital: 'hosp-001' });
    await createPatient({ ...validPatient(), firstName: 'Nyabol', surname: 'Kuol', phone: '+211912345888', dateOfBirth: '1997-01-20', registrationHospital: 'hosp-002' });

    const hospA = await getPatientsByHospital('hosp-001');
    const hospB = await getPatientsByHospital('hosp-002');
    expect(hospA).toHaveLength(1);
    expect(hospA[0].firstName).toBe('Achol');
    expect(hospB).toHaveLength(1);
    expect(hospB[0].firstName).toBe('Nyabol');
  });

  // ---- generateGeocodeId ----
  test('generateGeocodeId formats correctly', () => {
    expect(generateGeocodeId('xy', 1001)).toBe('BOMA-XY-HH1001');
    expect(generateGeocodeId('Ab-c', 42)).toBe('BOMA-ABC-HH42');
  });

  test('generateGeocodeId uppercases and strips non-alphanumeric', () => {
    expect(generateGeocodeId('x.y/z', 5)).toBe('BOMA-XYZ-HH5');
  });
});
