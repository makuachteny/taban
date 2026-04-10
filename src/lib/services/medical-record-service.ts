import { medicalRecordsDB } from '../db';
import type { MedicalRecordDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';
import { validateMedicalRecord, ValidationError } from '../validation';
import { logAudit } from './audit-service';

export async function getRecordsByPatient(patientId: string): Promise<MedicalRecordDoc[]> {
  const db = medicalRecordsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as MedicalRecordDoc)
    .filter(d => d && d.type === 'medical_record' && d.patientId === patientId)
    // Sort by consultedAt (full datetime) when present so records with the
    // same visitDate still order correctly. Fall back to visitDate/createdAt.
    .sort((a, b) => {
      const ak = a.consultedAt || a.visitDate || a.createdAt || '';
      const bk = b.consultedAt || b.visitDate || b.createdAt || '';
      return bk.localeCompare(ak);
    });
}

export async function createMedicalRecord(
  data: Omit<MedicalRecordDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<MedicalRecordDoc> {
  const errors = validateMedicalRecord(data as unknown as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  const db = medicalRecordsDB();
  const now = new Date().toISOString();
  const doc: MedicalRecordDoc = {
    _id: `rec-${uuidv4().slice(0, 12)}`,
    type: 'medical_record',
    ...data,
    createdAt: now,
    updatedAt: now,
  } as MedicalRecordDoc;
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_MEDICAL_RECORD', undefined, undefined, `Record ${doc._id} for patient ${doc.patientId}`).catch(() => {});
  return doc;
}

export async function updateMedicalRecord(id: string, data: Partial<MedicalRecordDoc>): Promise<MedicalRecordDoc | null> {
  const db = medicalRecordsDB();
  try {
    const existing = await db.get(id) as MedicalRecordDoc;
    const updated = {
      ...existing,
      ...data,
      _id: existing._id,
      _rev: existing._rev,
      updatedAt: new Date().toISOString(),
    };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    logAudit('UPDATE_MEDICAL_RECORD', undefined, undefined, `Updated record ${id} for patient ${updated.patientId}`).catch(() => {});
    return updated;
  } catch {
    return null;
  }
}

export async function deleteMedicalRecord(id: string): Promise<boolean> {
  const db = medicalRecordsDB();
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    return true;
  } catch {
    return false;
  }
}

export async function getRecentRecords(limit: number = 20): Promise<MedicalRecordDoc[]> {
  const db = medicalRecordsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as MedicalRecordDoc)
    .filter(d => d && d.type === 'medical_record')
    .sort((a, b) => (b.visitDate || '').localeCompare(a.visitDate || ''))
    .slice(0, limit);
}
