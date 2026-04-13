import { prescriptionsDB } from '../db';
import type { PrescriptionDoc } from '../db-types';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './audit-service';
import { validatePrescription, ValidationError } from '../validation';

export async function getAllPrescriptions(scope?: DataScope): Promise<PrescriptionDoc[]> {
  const db = prescriptionsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as PrescriptionDoc)
    .filter(d => d && d.type === 'prescription')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return scope ? filterByScope(all, scope) : all;
}

export async function getPrescriptionsByPatient(patientId: string): Promise<PrescriptionDoc[]> {
  const all = await getAllPrescriptions();
  return all.filter(p => p.patientId === patientId);
}

export async function createPrescription(
  data: Omit<PrescriptionDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<PrescriptionDoc> {
  // Validate required prescription fields
  const errors = validatePrescription(data as unknown as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const db = prescriptionsDB();
  const now = new Date().toISOString();
  const doc: PrescriptionDoc = {
    _id: `rx-${uuidv4().slice(0, 8)}`,
    type: 'prescription',
    ...data,
    createdAt: now,
    updatedAt: now,
  } as PrescriptionDoc;
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('PRESCRIPTION_CREATED', undefined, doc.prescribedBy,
    `Rx ${doc._id}: ${doc.medication} ${doc.dose} for ${doc.patientName}`
  ).catch(() => {});
  return doc;
}

export async function updatePrescription(id: string, data: Partial<PrescriptionDoc>): Promise<PrescriptionDoc | null> {
  const db = prescriptionsDB();
  try {
    const existing = await db.get(id) as PrescriptionDoc;
    const updated = { ...existing, ...data, _id: existing._id, _rev: existing._rev, updatedAt: new Date().toISOString() };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    logAudit('PRESCRIPTION_UPDATED', undefined, undefined, `Prescription ${id} status: ${updated.status}`).catch(() => {});
    return updated;
  } catch {
    return null;
  }
}

export async function dispensePrescription(id: string, dispensedBy?: string): Promise<PrescriptionDoc | null> {
  const now = new Date().toISOString();
  const result = await updatePrescription(id, {
    status: 'dispensed',
    dispensedAt: now,
  });
  if (result) {
    logAudit('PRESCRIPTION_DISPENSED', undefined, dispensedBy || 'unknown',
      `Dispensed ${result.medication} ${result.dose} to ${result.patientName} (Rx: ${id})`
    ).catch(() => {});
  }
  return result;
}
