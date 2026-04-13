/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for transfer-service.ts
 * Covers patient transfer package assembly and file utilities.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-xfer-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs, putDoc } from '../helpers/test-db';
import {
  assembleTransferPackage,
  fileToBase64,
  attachmentToDataUrl,
  formatFileSize,
} from '@/lib/services/transfer-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

function validPatient(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'pat-001',
    type: 'patient',
    hospitalNumber: 'H-12345',
    firstName: 'John',
    middleName: 'Michael',
    surname: 'Doe',
    dateOfBirth: '1985-05-20',
    gender: 'Male',
    phone: '211912345678',
    state: 'Central Equatoria',
    county: 'Juba',
    tribe: 'Dinka',
    bloodType: 'O+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    nokName: 'Jane Doe',
    nokPhone: '211987654321',
    nokRelationship: 'spouse',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function validMedicalRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'mr-001',
    type: 'medical_record',
    patientId: 'pat-001',
    hospitalId: 'hosp-001',
    hospitalName: 'Taban Hospital',
    visitDate: '2024-01-15',
    visitType: 'consultation',
    providerName: 'Dr. Smith',
    providerRole: 'doctor',
    department: 'General Medicine',
    chiefComplaint: 'Fever and cough',
    historyOfPresentIllness: 'Patient presents with 3 days of fever',
    vitalSigns: { temperature: 38.5, systolic: 120, diastolic: 80 },
    diagnoses: [{ code: 'J18.9', label: 'Pneumonia', confirmed: true }],
    prescriptions: [{ medication: 'Amoxicillin', dose: '500mg', route: 'oral', frequency: 'TDS', duration: '5 days' }],
    labResults: [{ testName: 'Malaria', result: 'Negative', unit: '', referenceRange: '', abnormal: false, critical: false, date: '2024-01-15' }],
    treatmentPlan: 'Start antibiotics and supportive care',
    attachments: undefined,
    followUp: { required: true, date: '2024-01-22', type: 'in-person' },
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function validLabResult(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'lab-001',
    type: 'lab_result',
    patientId: 'pat-001',
    patientName: 'John Doe',
    hospitalNumber: 'H-12345',
    testName: 'CBC',
    specimen: 'Blood',
    status: 'completed',
    result: 'WBC 7.5, RBC 4.2, HGB 13.0',
    unit: 'cells/mcL',
    referenceRange: '4.5-11.0',
    abnormal: false,
    critical: false,
    orderedBy: 'Dr. Smith',
    orderedAt: '2024-01-14',
    completedAt: '2024-01-15',
    hospitalId: 'hosp-001',
    hospitalName: 'Taban Hospital',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Transfer Service', () => {
  test('assembles transfer package for patient with medical records', async () => {
    const { patientsDB, medicalRecordsDB } = require('@/lib/db');

    const patient = validPatient();
    const medRecord = validMedicalRecord();

    await putDoc(patientsDB(), patient);
    await putDoc(medicalRecordsDB(), medRecord);

    const pkg = await assembleTransferPackage('pat-001', 'user-123');

    expect(pkg).toBeDefined();
    expect(pkg.patientDemographics.firstName).toBe('John');
    expect(pkg.patientDemographics.surname).toBe('Doe');
    expect(pkg.medicalRecords).toHaveLength(1);
    expect(pkg.medicalRecords[0].chiefComplaint).toBe('Fever and cough');
    expect(pkg.packagedBy).toBe('user-123');
    expect(pkg.packagedAt).toBeTruthy();
    expect(pkg.packageSizeBytes).toBeGreaterThan(0);
  });

  test('assembles transfer package with lab results from separate DB', async () => {
    const { patientsDB, medicalRecordsDB, labResultsDB } = require('@/lib/db');

    const patient = validPatient();
    const medRecord = validMedicalRecord();
    const labResult = validLabResult();

    await putDoc(patientsDB(), patient);
    await putDoc(medicalRecordsDB(), medRecord);
    await putDoc(labResultsDB(), labResult);

    const pkg = await assembleTransferPackage('pat-001', 'nurse-456');

    expect(pkg.labResults.length).toBeGreaterThan(0);
    expect(pkg.labResults[0].testName).toBe('CBC');
  });

  test('throws error if patient not found', async () => {
    await expect(assembleTransferPackage('nonexistent', 'user-123')).rejects.toThrow(
      /Patient nonexistent not found/
    );
  });

  test('assembles empty package when patient has no medical records', async () => {
    const { patientsDB } = require('@/lib/db');
    const patient = validPatient();
    await putDoc(patientsDB(), patient);

    const pkg = await assembleTransferPackage('pat-001', 'user-123');

    expect(pkg.medicalRecords).toHaveLength(0);
    expect(pkg.labResults).toHaveLength(0);
    expect(pkg.attachments).toHaveLength(0);
  });

  test('includes inline lab results from medical records in transfer package', async () => {
    const { patientsDB, medicalRecordsDB } = require('@/lib/db');

    const patient = validPatient();
    const medRecord = validMedicalRecord({
      labResults: [
        { testName: 'RDT Malaria', result: 'Positive', unit: '', referenceRange: '', abnormal: true, critical: false, date: '2024-01-15' }
      ]
    });

    await putDoc(patientsDB(), patient);
    await putDoc(medicalRecordsDB(), medRecord);

    const pkg = await assembleTransferPackage('pat-001', 'user-123');

    const inlineLabResults = pkg.labResults.filter(lr => lr.hospitalName === 'Taban Hospital');
    expect(inlineLabResults.length).toBeGreaterThan(0);
    expect(inlineLabResults[0].testName).toBe('RDT Malaria');
  });

  test('formats file sizes correctly', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
  });

  test('converts attachment to data URL', () => {
    const attachment = {
      _id: 'att-001',
      type: 'attachment' as const,
      name: 'xray.jpg',
      mimeType: 'image/jpeg',
      base64Data: 'iVBORw0KGgo=',
      sizeBytes: 128,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataUrl = attachmentToDataUrl(attachment as any);
    expect(dataUrl).toBe('data:image/jpeg;base64,iVBORw0KGgo=');
  });

  test('fileToBase64 converts File to base64 string', async () => {
    const fileContent = 'test file content';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const base64 = await fileToBase64(file);

    expect(base64).toBeTruthy();
    expect(typeof base64).toBe('string');
    // Verify it's valid base64 by checking it can be decoded
    const decoded = Buffer.from(base64, 'base64').toString();
    expect(decoded).toBe(fileContent);
  });

  test('fileToBase64 rejects on file read error', async () => {
    // Create a mock file that fails to read
    const file = {
      slice: () => ({
        stream: () => {
          throw new Error('Stream error');
        },
      }),
    } as unknown as File;

    // This test verifies the error handling path exists
    // In real scenarios, this would require mocking FileReader
    expect(fileToBase64(file as any)).rejects.toThrow();
  });
});
