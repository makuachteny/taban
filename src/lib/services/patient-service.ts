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

export async function createPatient(data: Omit<PatientDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<PatientDoc> {
  const errors = validatePatientData(data as unknown as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  const db = patientsDB();
  const now = new Date().toISOString();
  const id = `pat-${uuidv4().slice(0, 8)}`;
  const count = (await db.allDocs()).total_rows;
  const prefix = getHospitalPrefix(data.registrationHospital);
  const orgId = data.orgId || await inferOrgIdFromHospital(data.registrationHospital);
  const doc: PatientDoc = {
    _id: id,
    type: 'patient',
    ...data,
    orgId,
    hospitalNumber: data.hospitalNumber || `${prefix}-${String(count + 1).padStart(6, '0')}`,
    // Always capture a full date+time registration timestamp at the moment the
    // patient first enters the system. `registrationDate` remains for backward
    // compatibility (date only) but `registeredAt` is authoritative.
    registeredAt: data.registeredAt || now,
    createdAt: now,
    updatedAt: now,
  } as PatientDoc;
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_PATIENT', undefined, undefined, `Created patient ${doc._id}: ${data.firstName} ${data.surname}`).catch(() => {});
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
