import { ancDB } from '../db';
import type { ANCVisitDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';

export async function getAllANCVisits(scope?: DataScope): Promise<ANCVisitDoc[]> {
  const db = ancDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as ANCVisitDoc)
    .filter(d => d && d.type === 'anc_visit')
    .sort((a, b) => new Date(b.visitDate || '').getTime() - new Date(a.visitDate || '').getTime());
  return scope ? filterByScope(all, scope) : all;
}

export async function getByMother(motherId: string): Promise<ANCVisitDoc[]> {
  const all = await getAllANCVisits();
  return all.filter(v => v.motherId === motherId);
}

export async function getByFacility(facilityId: string): Promise<ANCVisitDoc[]> {
  const all = await getAllANCVisits();
  return all.filter(v => v.facilityId === facilityId);
}

export async function createANCVisit(data: Omit<ANCVisitDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<ANCVisitDoc> {
  const db = ancDB();
  const now = new Date().toISOString();
  const id = `anc-${uuidv4().slice(0, 8)}`;
  const doc: ANCVisitDoc = {
    _id: id,
    type: 'anc_visit',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  return doc;
}

export async function getANCStats(scope?: DataScope) {
  const all = await getAllANCVisits(scope);
  const thisMonth = new Date().toISOString().slice(0, 7);

  // Unique mothers
  const motherIds = new Set(all.map(v => v.motherId));
  const totalMothers = motherIds.size;

  // ANC4+ coverage: mothers with 4+ visits
  let anc4Plus = 0;
  for (const motherId of motherIds) {
    const visits = all.filter(v => v.motherId === motherId);
    const visitNumbers = visits.map(v => v.visitNumber);
    const maxVisit = visitNumbers.length > 0 ? Math.max(...visitNumbers) : 0;
    if (maxVisit >= 4) anc4Plus++;
  }

  // High risk count
  const highRiskMotherIds = new Set(
    all.filter(v => v.riskLevel === 'high').map(v => v.motherId)
  );

  // This month visits
  const thisMonthVisits = all.filter(v => (v.visitDate || '').startsWith(thisMonth)).length;

  // By state
  const byState = all.reduce((acc, v) => {
    const st = v.state || 'Unknown';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ANC1 coverage (mothers with at least 1 visit)
  const anc1 = totalMothers;

  return {
    totalMothers,
    anc1,
    anc4Plus,
    anc4PlusRate: totalMothers > 0 ? Math.round((anc4Plus / totalMothers) * 100) : 0,
    highRiskCount: highRiskMotherIds.size,
    thisMonthVisits,
    totalVisits: all.length,
    byState,
  };
}

export async function updateANCVisit(id: string, data: Partial<ANCVisitDoc>): Promise<ANCVisitDoc | null> {
  const db = ancDB();
  try {
    const existing = await db.get(id) as ANCVisitDoc;
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

export async function deleteANCVisit(id: string): Promise<boolean> {
  const db = ancDB();
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    return true;
  } catch {
    return false;
  }
}

export async function getHighRiskPregnancies(): Promise<ANCVisitDoc[]> {
  const all = await getAllANCVisits();
  // Get the most recent visit for each high-risk mother
  const motherLatest = new Map<string, ANCVisitDoc>();
  for (const visit of all) {
    if (visit.riskLevel === 'high') {
      const existing = motherLatest.get(visit.motherId);
      if (!existing || visit.visitNumber > existing.visitNumber) {
        motherLatest.set(visit.motherId, visit);
      }
    }
  }
  return Array.from(motherLatest.values());
}
