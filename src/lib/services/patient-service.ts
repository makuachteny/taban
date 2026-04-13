import { patientsDB, hospitalsDB } from '../db';
import type { PatientDoc, HospitalDoc } from '../db-types';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';
import { v4 as uuidv4 } from 'uuid';
import { validatePatientData, ValidationError } from '../validation';
import { logAudit } from './audit-service';

/**
 * Generate a geocode ID from boma code and household number.
 * Format: BOMA-{bomaCode}-HH{householdNumber}
 * Expert recommendation: Use household geocoding instead of national IDs.
 */
export function generateGeocodeId(bomaCode: string, householdNumber: number): string {
  const code = bomaCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `BOMA-${code}-HH${householdNumber}`;
}

export async function getAllPatients(scope?: DataScope): Promise<PatientDoc[]> {
  const db = patientsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as PatientDoc)
    .filter(d => d && d.type === 'patient');
  return scope ? filterByScope(all, scope) : all;
}

export async function getPatientById(id: string): Promise<PatientDoc | null> {
  try {
    const db = patientsDB();
    return await db.get(id) as PatientDoc;
  } catch {
    return null;
  }
}

export async function searchPatients(query: string, scope?: DataScope): Promise<PatientDoc[]> {
  const all = await getAllPatients(scope);
  const q = query.toLowerCase();
  return all.filter(p =>
    `${p.firstName} ${p.middleName || ''} ${p.surname}`.toLowerCase().includes(q) ||
    (p.hospitalNumber || '').toLowerCase().includes(q) ||
    (p.phone || '').includes(q) ||
    (p.geocodeId || '').toLowerCase().includes(q) ||
    (p.boma || '').toLowerCase().includes(q)
  );
}

// Map hospital IDs to short prefixes for hospital number generation
const HOSPITAL_PREFIXES: Record<string, string> = {
  'hosp-001': 'JTH', 'hosp-002': 'WSH', 'hosp-003': 'MTH', 'hosp-004': 'BSH',
  'hosp-005': 'RSH', 'hosp-006': 'BOR', 'hosp-007': 'TSH', 'hosp-008': 'YSH',
  'hosp-009': 'ASH', 'hosp-010': 'KSH',
};

function getHospitalPrefix(hospitalId?: string): string {
  if (!hospitalId) return 'TAB';
  if (HOSPITAL_PREFIXES[hospitalId]) return HOSPITAL_PREFIXES[hospitalId];
  if (hospitalId.startsWith('phcc-')) return 'PHC';
  if (hospitalId.startsWith('phcu-')) return 'BMU';
  if (hospitalId.startsWith('county-')) return 'CTY';
  return 'TAB';
}

async function inferOrgIdFromHospital(hospitalId?: string): Promise<string | undefined> {
  if (!hospitalId) return undefined;
  try {
    const hdb = hospitalsDB();
    const hosp = await hdb.get(hospitalId) as HospitalDoc;
    return hosp.orgId;
  } catch {
    return undefined;
  }
}

/**
 * Generate a unique hospital number using UUID suffix to avoid race conditions.
 * Format: PREFIX-XXXXXX (e.g., JTH-A3F2B1)
 */
async function generateHospitalNumber(hospitalId?: string): Promise<string> {
  const prefix = getHospitalPrefix(hospitalId);
  const db = patientsDB();
  const count = (await db.allDocs()).total_rows;
  // Use count + random suffix for uniqueness without race conditions
  const suffix = `${String(count + 1).padStart(4, '0')}${uuidv4().slice(0, 2).toUpperCase()}`;
  return `${prefix}-${suffix}`;
}

/**
 * Check for potential duplicate patients by name+DOB, phone, geocodeId, or nationalId.
 */
async function checkDuplicates(data: Record<string, unknown>, scope?: DataScope): Promise<string | null> {
  const all = await getAllPatients(scope);
  const firstName = ((data.firstName as string) || '').toLowerCase().trim();
  const surname = ((data.surname as string) || '').toLowerCase().trim();
  const dob = data.dateOfBirth as string | undefined;
  const phone = data.phone as string | undefined;
  const geocodeId = data.geocodeId as string | undefined;
  const nationalId = data.nationalId as string | undefined;

  for (const p of all) {
    // Match by name + DOB
    if (firstName && surname && dob &&
        p.firstName.toLowerCase() === firstName &&
        p.surname.toLowerCase() === surname &&
        p.dateOfBirth === dob) {
      return `A patient named "${p.firstName} ${p.surname}" with the same date of birth already exists (${p.hospitalNumber})`;
    }
    // Match by phone
    if (phone && phone.length >= 7 && p.phone === phone) {
      return `A patient with phone number ${phone} already exists (${p.firstName} ${p.surname}, ${p.hospitalNumber})`;
    }
    // Match by geocode ID
    if (geocodeId && p.geocodeId === geocodeId) {
      return `A patient with Geocode ID ${geocodeId} already exists (${p.firstName} ${p.surname})`;
    }
    // Match by national ID
    if (nationalId && nationalId.length >= 3 && p.nationalId === nationalId) {
      return `A patient with National ID ${nationalId} already exists (${p.firstName} ${p.surname})`;
    }
  }
  return null;
}

export async function createPatient(data: Omit<PatientDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<PatientDoc> {
  const errors = validatePatientData(data as unknown as Record<string, unknown>);

  // Check for duplicate patients
  const duplicateMsg = await checkDuplicates(data as unknown as Record<string, unknown>);
  if (duplicateMsg) {
    errors.duplicate = duplicateMsg;
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  const db = patientsDB();
  const now = new Date().toISOString();
  const id = `pat-${uuidv4().slice(0, 8)}`;
  const hospitalNumber = data.hospitalNumber || await generateHospitalNumber(data.registrationHospital);
  const orgId = data.orgId || await inferOrgIdFromHospital(data.registrationHospital);
  const doc: PatientDoc = {
    _id: id,
    type: 'patient',
    ...data,
    orgId,
    hospitalNumber,
    registeredAt: data.registeredAt || now,
    createdAt: now,
    updatedAt: now,
  } as PatientDoc;
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_PATIENT', undefined, undefined, `Created patient ${doc._id}: ${data.firstName} ${data.surname} (${hospitalNumber})`).catch(() => {});
  return doc;
}

export async function updatePatient(id: string, data: Partial<PatientDoc>): Promise<PatientDoc | null> {
  const db = patientsDB();
  const existing = await db.get(id) as PatientDoc;
  const inferredOrg = data.orgId || existing.orgId || await inferOrgIdFromHospital(data.registrationHospital || existing.registrationHospital);
  const updated = {
    ...existing,
    ...data,
    orgId: inferredOrg,
    _id: existing._id,
    _rev: existing._rev,
    updatedAt: new Date().toISOString(),
  };
  const errors = validatePatientData(updated as unknown as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  const resp = await db.put(updated);
  updated._rev = resp.rev;
  logAudit('UPDATE_PATIENT', undefined, undefined, `Updated patient ${id}`).catch(() => {});
  return updated;
}

export async function getPatientsByHospital(hospitalId: string): Promise<PatientDoc[]> {
  const all = await getAllPatients();
  return all.filter(p => p.registrationHospital === hospitalId);
}
