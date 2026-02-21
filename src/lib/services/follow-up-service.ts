import { followUpsDB } from '../db';
import type { FollowUpDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './audit-service';

export async function getAllFollowUps(): Promise<FollowUpDoc[]> {
  const db = followUpsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as FollowUpDoc)
    .filter(d => d && d.type === 'follow_up')
    .sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());
}

export async function getFollowUpsByWorker(workerId: string): Promise<FollowUpDoc[]> {
  const all = await getAllFollowUps();
  return all.filter(f => f.assignedWorker === workerId);
}

export async function getFollowUpsByPatient(patientId: string): Promise<FollowUpDoc[]> {
  const all = await getAllFollowUps();
  return all.filter(f => f.patientId === patientId);
}

export async function getPendingFollowUps(workerId?: string): Promise<FollowUpDoc[]> {
  const all = workerId ? await getFollowUpsByWorker(workerId) : await getAllFollowUps();
  return all.filter(f => f.status === 'active' || f.status === 'missed');
}

export async function createFollowUp(
  data: Omit<FollowUpDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<FollowUpDoc> {
  const db = followUpsDB();
  const now = new Date().toISOString();
  const doc: FollowUpDoc = {
    _id: `followup-${uuidv4().slice(0, 8)}`,
    type: 'follow_up',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_FOLLOW_UP', doc.assignedWorker, undefined, `Follow-up ${doc._id}: patient ${doc.patientId}, condition: ${doc.condition}`).catch(() => {});
  return doc;
}

export async function updateFollowUp(
  id: string,
  data: Partial<FollowUpDoc>
): Promise<FollowUpDoc | null> {
  const db = followUpsDB();
  try {
    const existing = await db.get(id) as FollowUpDoc;
    const updated = {
      ...existing,
      ...data,
      _id: existing._id,
      _rev: existing._rev,
      updatedAt: new Date().toISOString(),
    };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    logAudit('UPDATE_FOLLOW_UP', updated.assignedWorker, undefined, `Follow-up ${id}: status=${updated.status}${updated.outcome ? `, outcome=${updated.outcome}` : ''}`).catch(() => {});
    return updated;
  } catch {
    return null;
  }
}

export async function getFollowUpStats(workerId?: string) {
  const all = workerId ? await getFollowUpsByWorker(workerId) : await getAllFollowUps();
  const active = all.filter(f => f.status === 'active');
  const completed = all.filter(f => f.status === 'completed');
  const missed = all.filter(f => f.status === 'missed');
  const lost = all.filter(f => f.status === 'lost_to_followup');

  const recovered = completed.filter(f => f.outcome === 'recovered').length;
  const died = completed.filter(f => f.outcome === 'died').length;

  return {
    total: all.length,
    active: active.length,
    completed: completed.length,
    missed: missed.length,
    lostToFollowUp: lost.length,
    recovered,
    died,
  };
}
