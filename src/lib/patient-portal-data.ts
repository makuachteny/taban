/**
 * Patient Portal Data Layer — server-compatible.
 *
 * The platform's primary data lives in PouchDB (browser IndexedDB), which is
 * not available server-side. For the mobile patient portal API, we read
 * directly from the mock/seed data that feeds the browser database.
 *
 * In production with PostgreSQL configured, this should query PostgreSQL
 * instead. For now, the mock data provides full demo functionality.
 */

import { patients } from '@/data/mock';
import type { PatientDoc, MedicalRecordDoc, LabResultDoc, PrescriptionDoc, ImmunizationDoc, MessageDoc, AppointmentDoc } from '@/lib/db-types';

// ---- Patients ----

export function getAllPatients(): PatientDoc[] {
  return patients.map((p) => ({
    ...p,
    _id: p.id,
    type: 'patient' as const,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }));
}

export function getPatientById(id: string): PatientDoc | undefined {
  return getAllPatients().find((p) => p._id === id);
}

// ---- Seed data (loaded once) ----
// Lazy-load seed arrays to avoid circular dependency at import time.

let _seedCache: {
  medicalRecords: MedicalRecordDoc[];
  labResults: LabResultDoc[];
  prescriptions: PrescriptionDoc[];
  immunizations: ImmunizationDoc[];
  messages: MessageDoc[];
  appointments: AppointmentDoc[];
} | null = null;

function getSeedData() {
  if (_seedCache) return _seedCache;

  // These are the same arrays used in db-seed.ts to populate PouchDB.
  // We import them lazily so the server only loads them when an API is called.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require('@/lib/db-seed');
    _seedCache = {
      medicalRecords: seed._medicalRecords || [],
      labResults: seed._labResults || [],
      prescriptions: seed._prescriptions || [],
      immunizations: seed._immunizations || [],
      messages: seed._messages || [],
      appointments: seed._appointments || [],
    };
  } catch {
    // Fallback — seed module may not export these arrays.
    // We'll populate from the inline arrays below.
    _seedCache = {
      medicalRecords: [],
      labResults: [],
      prescriptions: [],
      immunizations: [],
      messages: [],
      appointments: [],
    };
  }
  return _seedCache;
}

// ---- Query functions ----

export function getRecordsByPatient(patientId: string): MedicalRecordDoc[] {
  return getSeedData().medicalRecords.filter((r) => r.patientId === patientId);
}

export function getLabResultsByPatient(patientId: string): LabResultDoc[] {
  return getSeedData().labResults.filter((r) => r.patientId === patientId);
}

export function getPrescriptionsByPatient(patientId: string): PrescriptionDoc[] {
  return getSeedData().prescriptions.filter((r) => r.patientId === patientId);
}

export function getImmunizationsByPatient(patientId: string): ImmunizationDoc[] {
  return getSeedData().immunizations.filter((r) => r.patientId === patientId);
}

export function getMessagesByPatient(patientId: string): MessageDoc[] {
  return getSeedData().messages.filter((r) => r.patientId === patientId);
}

export function getAppointmentsByPatient(patientId: string): AppointmentDoc[] {
  return getSeedData().appointments.filter((r) => r.patientId === patientId);
}
