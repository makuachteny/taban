/**
 * Tests for input validation functions
 */
import {
  validatePatientData,
  validateVitalSigns,
  validateMedicalRecord,
  ValidationError,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
} from '../lib/validation';

describe('validation', () => {
  describe('validatePatientData', () => {
    const validPatient = {
      firstName: 'John',
      surname: 'Deng',
      gender: 'male',
      dateOfBirth: '1990-01-15',
      state: 'Central Equatoria',
    };

    test('returns no errors for valid patient data', () => {
      const errors = validatePatientData(validPatient);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('requires firstName', () => {
      const errors = validatePatientData({ ...validPatient, firstName: '' });
      expect(errors.firstName).toBeDefined();
    });

    test('requires surname', () => {
      const errors = validatePatientData({ ...validPatient, surname: '' });
      expect(errors.surname).toBeDefined();
    });

    test('rejects too-long firstName', () => {
      const errors = validatePatientData({ ...validPatient, firstName: 'A'.repeat(101) });
      expect(errors.firstName).toContain('too long');
    });

    test('validates gender', () => {
      const errors = validatePatientData({ ...validPatient, gender: 'invalid' });
      expect(errors.gender).toBeDefined();
    });

    test('requires dateOfBirth or estimatedAge', () => {
      const noDate = { firstName: 'John', surname: 'Deng', gender: 'male', state: 'Central Equatoria' };
      const errors = validatePatientData(noDate);
      expect(errors.dateOfBirth).toBeDefined();
    });

    test('accepts estimatedAge instead of dateOfBirth', () => {
      const noDate = { firstName: 'John', surname: 'Deng', gender: 'male', state: 'Central Equatoria', estimatedAge: 25 };
      const errors = validatePatientData(noDate);
      expect(errors.dateOfBirth).toBeUndefined();
    });

    test('rejects future date of birth', () => {
      const errors = validatePatientData({ ...validPatient, dateOfBirth: '2099-01-01' });
      expect(errors.dateOfBirth).toContain('future');
    });

    test('validates phone format', () => {
      const errors = validatePatientData({ ...validPatient, phone: 'not-a-phone' });
      expect(errors.phone).toBeDefined();
    });

    test('accepts valid phone', () => {
      const errors = validatePatientData({ ...validPatient, phone: '+211912345678' });
      expect(errors.phone).toBeUndefined();
    });

    test('requires state', () => {
      const errors = validatePatientData({ ...validPatient, state: '' });
      expect(errors.state).toBeDefined();
    });
  });

  describe('validateVitalSigns', () => {
    test('returns no errors for valid vitals', () => {
      const errors = validateVitalSigns({
        temperature: 37.0,
        systolicBP: 120,
        diastolicBP: 80,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 70,
        height: 170,
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('rejects temperature out of range', () => {
      expect(validateVitalSigns({ temperature: 50 }).temperature).toBeDefined();
      expect(validateVitalSigns({ temperature: 20 }).temperature).toBeDefined();
    });

    test('rejects invalid blood pressure', () => {
      expect(validateVitalSigns({ systolicBP: 400 }).systolicBP).toBeDefined();
      expect(validateVitalSigns({ diastolicBP: 5 }).diastolicBP).toBeDefined();
    });

    test('rejects invalid pulse', () => {
      expect(validateVitalSigns({ pulse: 10 }).pulse).toBeDefined();
      expect(validateVitalSigns({ pulse: 300 }).pulse).toBeDefined();
    });

    test('rejects invalid oxygen saturation', () => {
      expect(validateVitalSigns({ oxygenSaturation: 25 }).oxygenSaturation).toBeDefined();
      expect(validateVitalSigns({ oxygenSaturation: 105 }).oxygenSaturation).toBeDefined();
    });

    test('allows empty vitals (all optional)', () => {
      const errors = validateVitalSigns({});
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('validateMedicalRecord', () => {
    test('requires patientId', () => {
      const errors = validateMedicalRecord({ hospitalId: 'hosp-001', chiefComplaint: 'Fever' });
      expect(errors.patientId).toBeDefined();
    });

    test('requires hospitalId', () => {
      const errors = validateMedicalRecord({ patientId: 'pat-001', chiefComplaint: 'Fever' });
      expect(errors.hospitalId).toBeDefined();
    });

    test('requires chiefComplaint with min length', () => {
      const errors = validateMedicalRecord({ patientId: 'pat-001', hospitalId: 'hosp-001', chiefComplaint: 'Ab' });
      expect(errors.chiefComplaint).toBeDefined();
    });

    test('validates nested vital signs', () => {
      const errors = validateMedicalRecord({
        patientId: 'pat-001',
        hospitalId: 'hosp-001',
        chiefComplaint: 'Fever and chills',
        vitalSigns: { temperature: 55 },
      });
      expect(errors['vitalSigns.temperature']).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    test('creates error with field details', () => {
      const err = new ValidationError({ name: 'Required', age: 'Must be positive' });
      expect(err.name).toBe('ValidationError');
      expect(err.fields.name).toBe('Required');
      expect(err.fields.age).toBe('Must be positive');
      expect(err.message).toContain('Required');
    });
  });

  describe('constants', () => {
    test('MAX_FILE_SIZE_BYTES is 5MB', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });

    test('ALLOWED_FILE_TYPES includes common medical formats', () => {
      expect(ALLOWED_FILE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_FILE_TYPES).toContain('image/png');
      expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
      expect(ALLOWED_FILE_TYPES).toContain('application/dicom');
    });
  });
});
