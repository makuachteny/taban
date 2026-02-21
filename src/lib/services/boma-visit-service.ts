import { bomaVisitsDB } from '../db';
import type { BomaVisitDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './audit-service';

export async function getAllBomaVisits(): Promise<BomaVisitDoc[]> {
  const db = bomaVisitsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as BomaVisitDoc)
    .filter(d => d && d.type === 'boma_visit')
    .sort((a, b) => new Date(b.visitDate || '').getTime() - new Date(a.visitDate || '').getTime());
}

export async function getVisitsByWorker(workerId: string): Promise<BomaVisitDoc[]> {
  const all = await getAllBomaVisits();
  return all.filter(v => v.workerId === workerId);
}

export async function getVisitsByPatient(geocodeId: string): Promise<BomaVisitDoc[]> {
  const all = await getAllBomaVisits();
  return all.filter(v => v.geocodeId === geocodeId);
}

export async function getTodaysVisits(workerId: string): Promise<BomaVisitDoc[]> {
  const today = new Date().toISOString().slice(0, 10);
  const workerVisits = await getVisitsByWorker(workerId);
  return workerVisits.filter(v => (v.visitDate || '').startsWith(today));
}

export async function createBomaVisit(
  data: Omit<BomaVisitDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<BomaVisitDoc> {
  const db = bomaVisitsDB();
  const now = new Date().toISOString();
  const doc: BomaVisitDoc = {
    _id: `boma-visit-${uuidv4().slice(0, 8)}`,
    type: 'boma_visit',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_BOMA_VISIT', doc.workerId, undefined, `Visit ${doc._id}: ${doc.patientName} (${doc.geocodeId}) - ${doc.chiefComplaint}, action: ${doc.action}`).catch(() => {});
  return doc;
}

export async function updateBomaVisit(
  id: string,
  data: Partial<BomaVisitDoc>
): Promise<BomaVisitDoc | null> {
  const db = bomaVisitsDB();
  try {
    const existing = await db.get(id) as BomaVisitDoc;
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

// ===== Remote Patient Review Functions (Expert: supervisor review of BHW visits) =====

export async function getVisitsForReview(payam?: string): Promise<BomaVisitDoc[]> {
  const all = await getAllBomaVisits();
  const pending = all.filter(v => !v.reviewStatus || v.reviewStatus === 'pending');
  if (payam) return pending.filter(v => v.payam === payam);
  return pending;
}

export async function reviewVisit(
  visitId: string,
  reviewerId: string,
  reviewerName: string,
  status: 'reviewed' | 'flagged',
  notes: string,
): Promise<BomaVisitDoc | null> {
  const result = await updateBomaVisit(visitId, {
    reviewStatus: status,
    reviewedBy: reviewerId,
    reviewedByName: reviewerName,
    reviewedAt: new Date().toISOString(),
    reviewNotes: notes,
  });
  if (result) {
    logAudit('REVIEW_BOMA_VISIT', reviewerId, reviewerName, `Review ${visitId}: ${status} — ${notes}`).catch(() => {});
  }
  return result;
}

export async function getReviewStats() {
  const all = await getAllBomaVisits();
  const pending = all.filter(v => !v.reviewStatus || v.reviewStatus === 'pending').length;
  const reviewed = all.filter(v => v.reviewStatus === 'reviewed').length;
  const flagged = all.filter(v => v.reviewStatus === 'flagged').length;
  return { pending, reviewed, flagged, total: all.length };
}

// ===== BHW Performance Tracking (Expert: "The Payam supervises Bomas. They need to know which Boma is working") =====

export interface BHWPerformance {
  workerId: string;
  workerName: string;
  boma: string;
  totalVisits: number;
  thisWeekVisits: number;
  treated: number;
  referred: number;
  referralRate: number;
  followUpCompletionRate: number;
  lastActiveDate: string;
  isActive: boolean; // Active if visited in last 7 days
  pendingReviews: number;
}

export async function getBHWPerformance(): Promise<BHWPerformance[]> {
  const all = await getAllBomaVisits();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // Group by worker
  const byWorker = new Map<string, BomaVisitDoc[]>();
  for (const visit of all) {
    const existing = byWorker.get(visit.workerId) || [];
    existing.push(visit);
    byWorker.set(visit.workerId, existing);
  }

  const performances: BHWPerformance[] = [];

  for (const [workerId, visits] of byWorker) {
    const sorted = visits.sort((a, b) => new Date(b.visitDate || '').getTime() - new Date(a.visitDate || '').getTime());
    const thisWeek = visits.filter(v => new Date(v.visitDate || '') >= weekAgo);
    const treated = visits.filter(v => v.action === 'treated').length;
    const referred = visits.filter(v => v.action === 'referred').length;
    const followUpNeeded = visits.filter(v => v.followUpRequired).length;
    const followUpDone = visits.filter(v => v.followUpRequired && v.outcome !== 'unknown').length;
    const pendingReviews = visits.filter(v => !v.reviewStatus || v.reviewStatus === 'pending').length;

    performances.push({
      workerId,
      workerName: sorted[0]?.workerName || 'Unknown',
      boma: sorted[0]?.boma || 'Unknown',
      totalVisits: visits.length,
      thisWeekVisits: thisWeek.length,
      treated,
      referred,
      referralRate: visits.length > 0 ? Math.round((referred / visits.length) * 100) : 0,
      followUpCompletionRate: followUpNeeded > 0 ? Math.round((followUpDone / followUpNeeded) * 100) : 100,
      lastActiveDate: sorted[0]?.visitDate || '',
      isActive: sorted[0] ? new Date(sorted[0].visitDate || '') >= weekAgo : false,
      pendingReviews,
    });
  }

  return performances.sort((a, b) => b.thisWeekVisits - a.thisWeekVisits);
}

export async function getBomaStats(workerId: string) {
  const visits = await getVisitsByWorker(workerId);
  const today = new Date().toISOString().slice(0, 10);
  const todaysVisits = visits.filter(v => (v.visitDate || '').startsWith(today));
  const pendingFollowUps = visits.filter(v => v.followUpRequired && v.outcome === 'unknown');
  const referrals = visits.filter(v => v.action === 'referred');
  const todayReferrals = referrals.filter(v => (v.visitDate || '').startsWith(today));

  // Unique households visited
  const uniqueHouseholds = new Set(visits.map(v => v.geocodeId)).size;

  // Conditions breakdown
  const conditions: Record<string, number> = {};
  for (const v of visits) {
    const complaint = v.chiefComplaint || 'Unknown';
    conditions[complaint] = (conditions[complaint] || 0) + 1;
  }

  return {
    totalVisits: visits.length,
    todaysVisits: todaysVisits.length,
    pendingFollowUps: pendingFollowUps.length,
    totalReferrals: referrals.length,
    todayReferrals: todayReferrals.length,
    uniqueHouseholds,
    conditions,
  };
}
