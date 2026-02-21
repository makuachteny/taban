import { immunizationsDB } from '../db';
import type { ImmunizationDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';

export async function getAllImmunizations(): Promise<ImmunizationDoc[]> {
  const db = immunizationsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as ImmunizationDoc)
    .filter(d => d && d.type === 'immunization')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
}

export async function getByPatient(patientId: string): Promise<ImmunizationDoc[]> {
  const all = await getAllImmunizations();
  return all.filter(i => i.patientId === patientId);
}

export async function getByFacility(facilityId: string): Promise<ImmunizationDoc[]> {
  const all = await getAllImmunizations();
  return all.filter(i => i.facilityId === facilityId);
}

export async function createImmunization(data: Omit<ImmunizationDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<ImmunizationDoc> {
  const db = immunizationsDB();
  const now = new Date().toISOString();
  const id = `imm-${uuidv4().slice(0, 8)}`;
  const doc: ImmunizationDoc = {
    _id: id,
    type: 'immunization',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  return doc;
}

export async function updateImmunization(id: string, data: Partial<ImmunizationDoc>): Promise<ImmunizationDoc | null> {
  const db = immunizationsDB();
  try {
    const existing = await db.get(id) as ImmunizationDoc;
    const updated = {
      ...existing,
      ...data,
      _id: existing._id,
      _rev: existing._rev,
      updatedAt: new Date().toISOString(),
    };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    return updated;
  } catch {
    return null;
  }
}

export async function deleteImmunization(id: string): Promise<boolean> {
  const db = immunizationsDB();
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    return true;
  } catch {
    return false;
  }
}

export async function getImmunizationStats() {
  const all = await getAllImmunizations();
  const completed = all.filter(i => i.status === 'completed');
  const overdue = all.filter(i => i.status === 'overdue');
  const scheduled = all.filter(i => i.status === 'scheduled');
  const missed = all.filter(i => i.status === 'missed');

  // Unique children
  const childIds = new Set(all.map(i => i.patientId));
  const childrenWithAllDoses = new Set<string>();

  // Check fully immunized (has BCG + Penta3 + Measles1 completed)
  for (const childId of childIds) {
    const childRecords = completed.filter(i => i.patientId === childId);
    const hasBCG = childRecords.some(i => i.vaccine === 'BCG');
    const hasPenta3 = childRecords.some(i => i.vaccine === 'Penta' && i.doseNumber === 3);
    const hasMeasles1 = childRecords.some(i => i.vaccine === 'Measles' && i.doseNumber === 1);
    if (hasBCG && hasPenta3 && hasMeasles1) {
      childrenWithAllDoses.add(childId);
    }
  }

  const totalChildren = childIds.size;
  const coverageRate = totalChildren > 0 ? Math.round((childrenWithAllDoses.size / totalChildren) * 100) : 0;

  // By state
  const byState = all.reduce((acc, i) => {
    const st = i.state || 'Unknown';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalVaccinations: completed.length,
    totalChildren,
    fullyImmunized: childrenWithAllDoses.size,
    overdue: overdue.length,
    scheduled: scheduled.length,
    missed: missed.length,
    coverageRate,
    byState,
  };
}

// ===== Immunization Defaulter Tracker (Expert Priority: "Even if you don't do these other things, do this") =====

export interface ImmunizationDefaulter {
  patientId: string;
  patientName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  ageMonths: number;
  vaccine: string;
  doseNumber: number;
  dueDate: string;
  daysOverdue: number;
  urgency: 'critical' | 'high' | 'medium'; // >30 days, >14 days, >0 days
  facilityName: string;
  state: string;
  lastVaccineDate?: string;
}

export async function getDefaulters(): Promise<ImmunizationDefaulter[]> {
  const all = await getAllImmunizations();
  const now = new Date();
  const defaulters: ImmunizationDefaulter[] = [];

  // Group by child
  const byChild = new Map<string, ImmunizationDoc[]>();
  for (const imm of all) {
    const existing = byChild.get(imm.patientId) || [];
    existing.push(imm);
    byChild.set(imm.patientId, existing);
  }

  for (const [, records] of byChild) {
    // Find records that are overdue or have a past nextDueDate with no completed follow-up
    const overdueRecords = records.filter(r => r.status === 'overdue' || r.status === 'missed');
    const scheduledRecords = records.filter(r => r.status === 'scheduled' && r.nextDueDate && new Date(r.nextDueDate) < now);

    const allOverdue = [...overdueRecords, ...scheduledRecords];

    for (const rec of allOverdue) {
      const dueDate = new Date(rec.nextDueDate || rec.dateGiven);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));

      if (daysOverdue <= 0) continue;

      const dob = new Date(rec.dateOfBirth || '');
      const ageMonths = Math.floor((now.getTime() - dob.getTime()) / (30.44 * 86400000));

      // Find the most recent completed vaccine for this child
      const completedRecords = records.filter(r => r.status === 'completed');
      const lastCompleted = completedRecords.sort((a, b) =>
        new Date(b.dateGiven || '').getTime() - new Date(a.dateGiven || '').getTime()
      )[0];

      defaulters.push({
        patientId: rec.patientId,
        patientName: rec.patientName,
        gender: rec.gender,
        dateOfBirth: rec.dateOfBirth,
        ageMonths,
        vaccine: rec.vaccine,
        doseNumber: rec.doseNumber,
        dueDate: rec.nextDueDate || rec.dateGiven,
        daysOverdue,
        urgency: daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : 'medium',
        facilityName: rec.facilityName,
        state: rec.state,
        lastVaccineDate: lastCompleted?.dateGiven,
      });
    }
  }

  // Sort by urgency (most overdue first)
  return defaulters.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export async function getDefaultersByBoma(bomaCode?: string): Promise<ImmunizationDefaulter[]> {
  const defaulters = await getDefaulters();
  if (!bomaCode) return defaulters;
  return defaulters.filter(d => d.facilityName.toLowerCase().includes(bomaCode.toLowerCase()));
}

export async function getDefaulterStats() {
  const defaulters = await getDefaulters();
  const critical = defaulters.filter(d => d.urgency === 'critical').length;
  const high = defaulters.filter(d => d.urgency === 'high').length;
  const medium = defaulters.filter(d => d.urgency === 'medium').length;
  const uniqueChildren = new Set(defaulters.map(d => d.patientId)).size;

  // By vaccine
  const byVaccine: Record<string, number> = {};
  for (const d of defaulters) {
    byVaccine[d.vaccine] = (byVaccine[d.vaccine] || 0) + 1;
  }

  return {
    totalDefaulters: defaulters.length,
    uniqueChildren,
    critical,
    high,
    medium,
    byVaccine,
  };
}

export async function getVaccineCoverage() {
  const all = await getAllImmunizations();
  const completed = all.filter(i => i.status === 'completed');
  const childIds = new Set(all.map(i => i.patientId));
  const totalChildren = childIds.size;

  const vaccines = ['BCG', 'OPV', 'Penta', 'PCV', 'Rota', 'Measles', 'Yellow Fever', 'Vitamin A'];
  const coverage: { vaccine: string; count: number; percentage: number }[] = [];

  for (const vaccine of vaccines) {
    const childrenWithVaccine = new Set(
      completed.filter(i => i.vaccine === vaccine).map(i => i.patientId)
    );
    coverage.push({
      vaccine,
      count: childrenWithVaccine.size,
      percentage: totalChildren > 0 ? Math.round((childrenWithVaccine.size / totalChildren) * 100) : 0,
    });
  }

  return coverage;
}
