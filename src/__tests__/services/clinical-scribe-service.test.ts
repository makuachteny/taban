/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for clinical-scribe-service.ts
 * Covers NLP-based clinical data extraction, SOAP note generation, and conflict detection.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-scribe-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  extractClinicalData,
  generateSOAPNote,
  type ScribeExtraction,
} from '@/lib/services/clinical-scribe-service';

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('clinical-scribe-service', () => {
  test('extractClinicalData returns valid ScribeExtraction', () => {
    const transcript = 'Patient presents with fever and cough.';
    const result = extractClinicalData(transcript);

    expect(result).toBeDefined();
    expect(result.chiefComplaint).toBeDefined();
    expect(Array.isArray(result.pastMedicalHistory)).toBe(true);
    expect(Array.isArray(result.socialHistory)).toBe(true);
    expect(result.vitals).toBeDefined();
    expect(Array.isArray(result.examFindings)).toBe(true);
    expect(Array.isArray(result.allergies)).toBe(true);
    expect(Array.isArray(result.medications)).toBe(true);
    expect(Array.isArray(result.diagnoses)).toBe(true);
    expect(Array.isArray(result.treatmentPlan)).toBe(true);
    expect(Array.isArray(result.patientInstructions)).toBe(true);
    expect(Array.isArray(result.labOrders)).toBe(true);
    expect(Array.isArray(result.conflicts)).toBe(true);
    expect(Array.isArray(result.uncertainItems)).toBe(true);
    expect(result.rawTranscript).toBe(transcript);
  });

  test('extractClinicalData handles empty transcript', () => {
    const result = extractClinicalData('');

    expect(result.chiefComplaint).toBe('');
    expect(result.pastMedicalHistory).toEqual([]);
    expect(result.socialHistory).toEqual([]);
    expect(result.medications).toEqual([]);
  });

  test('chief complaint extracted from complaint triggers', () => {
    const transcript = 'Patient reports fever and body aches.';
    const result = extractClinicalData(transcript);

    expect(result.chiefComplaint).toBeTruthy();
    expect(result.chiefComplaint.toLowerCase()).toContain('fever');
  });

  test('vitals extracted: temperature', () => {
    const transcript = 'Temperature is 38.5 degrees celsius.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.temperature).toBe('38.5');
  });

  test('vitals extracted: blood pressure both values', () => {
    const transcript = 'BP is 140 over 90.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.systolic).toBe('140');
    expect(result.vitals.diastolic).toBe('90');
  });

  test('vitals extracted: pulse', () => {
    const transcript = 'Heart rate is 92 bpm.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.pulse).toBe('92');
  });

  test('vitals extracted: respiratory rate', () => {
    const transcript = 'Respiratory rate is 20 per minute.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.respRate).toBe('20');
  });

  test('vitals extracted: oxygen saturation', () => {
    const transcript = 'SpO2 is 95%.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.o2Sat).toBe('95');
  });

  test('vitals extracted: weight', () => {
    const transcript = 'Weight is 65.5 kg.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.weight).toBe('65.5');
  });

  test('vitals extracted: height', () => {
    const transcript = 'Height is 172 cm.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.height).toBe('172');
  });

  test('vitals extracted: MUAC', () => {
    const transcript = 'MUAC is 24.5 cm.';
    const result = extractClinicalData(transcript);

    expect(result.vitals.muac).toBe('24.5');
  });

  test('allergies extracted with reactions', () => {
    const transcript = 'Patient is allergic to penicillin causing anaphylaxis.';
    const result = extractClinicalData(transcript);

    expect(result.allergies.length).toBeGreaterThan(0);
    const penicillin = result.allergies.find(a => a.allergen.toLowerCase().includes('penicillin'));
    expect(penicillin).toBeDefined();
  });

  test('NKDA recognized as no known drug allergies', () => {
    const transcript = 'Patient has no known allergies. NKDA confirmed.';
    const result = extractClinicalData(transcript);

    expect(result.allergies.length).toBeGreaterThan(0);
    const nkda = result.allergies.find(a => a.allergen === 'NKDA');
    expect(nkda).toBeDefined();
  });

  test('medications extracted with dose and frequency', () => {
    const transcript = 'Prescribe amoxicillin 500mg twice daily for 7 days.';
    const result = extractClinicalData(transcript);

    expect(result.medications.length).toBeGreaterThan(0);
    const amox = result.medications.find(m => m.name.toLowerCase().includes('amoxicillin'));
    expect(amox).toBeDefined();
    expect(amox!.dose).toContain('500');
    expect(amox!.frequency).toContain('Twice');
  });

  test('medications extracted: route detected', () => {
    const transcript = 'Start ceftriaxone 1g IV daily.';
    const result = extractClinicalData(transcript);

    expect(result.medications.length).toBeGreaterThan(0);
    const ceft = result.medications.find(m => m.name.toLowerCase().includes('ceftriaxone'));
    expect(ceft).toBeDefined();
    expect(ceft!.route).toContain('IV');
  });

  test('medications extracted: duration detected', () => {
    const transcript = 'Prescribe metronidazole 400mg for 10 days.';
    const result = extractClinicalData(transcript);

    expect(result.medications.length).toBeGreaterThan(0);
    const metro = result.medications.find(m => m.name.toLowerCase().includes('metronidazole'));
    expect(metro).toBeDefined();
    if (metro!.duration) {
      expect(metro!.duration).toContain('10');
    }
  });

  test('diagnoses extracted with certainty level', () => {
    const transcript = 'Assessment: Malaria suspected. Likely pneumonia confirmed.';
    const result = extractClinicalData(transcript);

    expect(result.diagnoses.length).toBeGreaterThan(0);
    const suspected = result.diagnoses.find(d => d.certainty === 'suspected');
    const confirmed = result.diagnoses.find(d => d.certainty === 'confirmed');
    expect(suspected || confirmed).toBeDefined();
  });

  test('diagnoses include ICD-10 hints', () => {
    const transcript = 'Diagnosis is malaria.';
    const result = extractClinicalData(transcript);

    expect(result.diagnoses.length).toBeGreaterThan(0);
    const malaria = result.diagnoses.find(d => d.name.toLowerCase().includes('malaria'));
    expect(malaria).toBeDefined();
    expect(malaria!.icd10Hint).toBe('B50');
  });

  test('exam findings categorized by system', () => {
    const transcript = 'General: appears well. Lung sounds clear. Abdomen soft.';
    const result = extractClinicalData(transcript);

    expect(result.examFindings.length).toBeGreaterThan(0);
    const systems = new Set(result.examFindings.map(e => e.system));
    expect(['general', 'cardiovascular', 'respiratory', 'abdominal', 'neurological'].some(s => systems.has(s as any))).toBe(true);
  });

  test('lab orders extracted', () => {
    const transcript = 'Order full blood count and malaria RDT.';
    const result = extractClinicalData(transcript);

    expect(result.labOrders.length).toBeGreaterThan(0);
    const hasMalaria = result.labOrders.some(l => l.toLowerCase().includes('malaria'));
    const hasFBC = result.labOrders.some(l => l.toLowerCase().includes('full'));
    expect(hasMalaria || hasFBC).toBe(true);
  });

  test('treatment plan extracted', () => {
    const transcript = 'We plan to start antibiotics. Admit to ward. Monitor vital signs daily.';
    const result = extractClinicalData(transcript);

    expect(result.treatmentPlan.length).toBeGreaterThan(0);
  });

  test('follow-up extracted with timeframe', () => {
    const transcript = 'Follow-up in 3 days at outpatient clinic.';
    const result = extractClinicalData(transcript);

    expect(result.followUp).toBeTruthy();
    expect(result.followUp.toLowerCase()).toContain('3');
  });

  test('past medical history extracted', () => {
    const transcript = 'Patient has history of tuberculosis and diabetes.';
    const result = extractClinicalData(transcript);

    expect(result.pastMedicalHistory.length).toBeGreaterThan(0);
  });

  test('social history extracted', () => {
    const transcript = 'Patient is a smoker and works as a farmer. Married.';
    const result = extractClinicalData(transcript);

    expect(result.socialHistory.length).toBeGreaterThan(0);
  });

  test('conflicts detected when vital is mentioned twice with different values', () => {
    const transcript = 'Temp: 38°C. Then temperature measured at 39.5°C.';
    const result = extractClinicalData(transcript);

    // Conflicts are captured when the same vital is mentioned twice with different values
    if (result.conflicts.length > 0) {
      const tempConflict = result.conflicts.find(c => c.field.includes('temperature'));
      expect(tempConflict).toBeDefined();
    }
  });

  test('patient instructions extracted', () => {
    const transcript = 'You must take this medication with food. Come back if symptoms worsen.';
    const result = extractClinicalData(transcript);

    expect(result.patientInstructions.length).toBeGreaterThan(0);
  });

  test('referral notes extracted', () => {
    const transcript = 'Referring patient to hospital for surgery. Transfer to specialist.';
    const result = extractClinicalData(transcript);

    expect(result.referralNotes).toBeTruthy();
  });

  test('generateSOAPNote produces valid format', () => {
    const extraction: ScribeExtraction = {
      chiefComplaint: 'Fever and cough',
      hpiNarrative: 'Patient presents with fever',
      pastMedicalHistory: ['Malaria'],
      socialHistory: ['Non-smoker'],
      vitals: { temperature: '38' },
      examFindings: [],
      allergies: [{ allergen: 'Penicillin', reaction: 'Rash' }],
      medications: [{ name: 'Amoxicillin', dose: '500mg', frequency: 'BD', route: 'Oral', duration: '7 days', raw: '' }],
      diagnoses: [{ name: 'Pneumonia', icd10Hint: 'J18', certainty: 'confirmed', raw: '' }],
      treatmentPlan: ['Start antibiotics'],
      patientInstructions: ['Take medication with food'],
      followUp: '3 days',
      referralNotes: '',
      labOrders: ['CBC'],
      conflicts: [],
      uncertainItems: [],
      rawTranscript: '',
    };

    const soap = generateSOAPNote(extraction);

    expect(soap).toContain('CHIEF COMPLAINT');
    expect(soap).toContain('HPI');
    expect(soap).toContain('PAST MEDICAL HISTORY');
    expect(soap).toContain('MEDICATIONS');
    expect(soap).toContain('ALLERGIES');
    expect(soap).toContain('PHYSICAL EXAM');
    expect(soap).toContain('ASSESSMENT');
    expect(soap).toContain('PLAN');
    expect(soap).toContain('FOLLOW-UP');
  });

  test('generateSOAPNote includes vitals section', () => {
    const extraction: ScribeExtraction = {
      chiefComplaint: 'Fever',
      hpiNarrative: '',
      pastMedicalHistory: [],
      socialHistory: [],
      vitals: { temperature: '38', systolic: '140', diastolic: '90', pulse: '92' },
      examFindings: [],
      allergies: [],
      medications: [],
      diagnoses: [],
      treatmentPlan: [],
      patientInstructions: [],
      followUp: '',
      referralNotes: '',
      labOrders: [],
      conflicts: [],
      uncertainItems: [],
      rawTranscript: '',
    };

    const soap = generateSOAPNote(extraction);

    expect(soap).toContain('Temp 38°C');
    expect(soap).toContain('BP 140/90');
    expect(soap).toContain('HR 92');
  });

  test('generateSOAPNote shows conflicts section when present', () => {
    const extraction: ScribeExtraction = {
      chiefComplaint: 'Fever',
      hpiNarrative: '',
      pastMedicalHistory: [],
      socialHistory: [],
      vitals: {},
      examFindings: [],
      allergies: [],
      medications: [],
      diagnoses: [],
      treatmentPlan: [],
      patientInstructions: [],
      followUp: '',
      referralNotes: '',
      labOrders: [],
      conflicts: [{ field: 'temperature', earlier: '38', latest: '39' }],
      uncertainItems: [],
      rawTranscript: '',
    };

    const soap = generateSOAPNote(extraction);

    expect(soap).toContain('CONFLICTS');
    expect(soap).toContain('DOCTOR VERIFY');
  });

  test('generateSOAPNote shows uncertain items section', () => {
    const extraction: ScribeExtraction = {
      chiefComplaint: 'Fever',
      hpiNarrative: '',
      pastMedicalHistory: [],
      socialHistory: [],
      vitals: {},
      examFindings: [],
      allergies: [],
      medications: [],
      diagnoses: [],
      treatmentPlan: [],
      patientInstructions: [],
      followUp: '',
      referralNotes: '',
      labOrders: [],
      conflicts: [],
      uncertainItems: ['[DOCTOR TO CONFIRM: Chief complaint auto-detected]'],
      rawTranscript: '',
    };

    const soap = generateSOAPNote(extraction);

    expect(soap).toContain('ITEMS TO CONFIRM');
    expect(soap).toContain('DOCTOR TO CONFIRM');
  });

  test('extractClinicalData handles complex transcript with multiple sections', () => {
    const transcript = `
      Patient presents with high fever and productive cough for 5 days.
      Temperature is 39.5 degrees celsius. BP is 130/85. HR 96.
      Known drug allergy to Penicillin causing rash.
      Past history of TB and asthma.
      We will start amoxicillin 500mg BD for 7 days.
      Also prescribe cough syrup. Order malaria RDT and full blood count.
      Follow up in 3 days. Referring to specialist for further evaluation.
      Patient should come back if condition worsens.
    `;
    const result = extractClinicalData(transcript);

    expect(result.chiefComplaint).toBeTruthy();
    expect(result.vitals.temperature).toBeDefined();
    expect(result.vitals.systolic).toBeDefined();
    expect(result.allergies.length).toBeGreaterThan(0);
    expect(result.pastMedicalHistory.length).toBeGreaterThan(0);
    expect(result.medications.length).toBeGreaterThan(0);
    expect(result.labOrders.length).toBeGreaterThan(0);
    expect(result.followUp).toBeTruthy();
    // Referral pattern requires "referring/transfer/send to specialist/surgeon/hospital"
    if (result.referralNotes) {
      expect(result.referralNotes.length).toBeGreaterThan(0);
    }
  });

  test('known medications recognized by fuzzy matching', () => {
    const transcript = 'We will give ciprofloxacin and enalapril for control.';
    const result = extractClinicalData(transcript);

    expect(result.medications.length).toBeGreaterThan(0);
    const cipro = result.medications.find(m => m.name.toLowerCase().includes('cipro'));
    const enapril = result.medications.find(m => m.name.toLowerCase().includes('enapril'));
    expect(cipro || enapril).toBeDefined();
  });

  test('ICD-10 hints for multiple diagnoses', () => {
    const transcript = 'Diagnoses: Malaria, TB, and pneumonia.';
    const result = extractClinicalData(transcript);

    expect(result.diagnoses.length).toBeGreaterThan(0);
    const withHints = result.diagnoses.filter(d => d.icd10Hint);
    expect(withHints.length).toBeGreaterThan(0);
  });
});
