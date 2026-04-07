import { referralsDB, hospitalsDB } from '../db';
import type { ReferralDoc, HospitalDoc } from '../db-types';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';
import type { Attachment } from '@/data/mock';
import { v4 as uuidv4 } from 'uuid';
import { assembleTransferPackage } from './transfer-service';
import { logAudit } from './audit-service';

async function inferOrgId(fromHospitalId?: string, toHospitalId?: string): Promise<string | undefined> {
  try {
    const hdb = hospitalsDB();
    if (fromHospitalId) {
      const from = await hdb.get(fromHospitalId) as HospitalDoc;
      if (from?.orgId) return from.orgId;
    }
    if (toHospitalId) {
      const to = await hdb.get(toHospitalId) as HospitalDoc;
      if (to?.orgId) return to.orgId;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function getAllReferrals(scope?: DataScope): Promise<ReferralDoc[]> {
  const db = referralsDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as ReferralDoc)
    .filter(d => d && d.type === 'referral')
    .sort((a, b) => (b.referralDate || '').localeCompare(a.referralDate || ''));
  return scope ? filterByScope(all, scope) : all;
}

export async function getReferralsByHospital(hospitalId: string): Promise<ReferralDoc[]> {
  const all = await getAllReferrals();
  return all.filter(r => r.toHospitalId === hospitalId || r.fromHospitalId === hospitalId);
}

export async function createReferral(
  data: Omit<ReferralDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<ReferralDoc> {
  const db = referralsDB();
  const now = new Date().toISOString();
  const orgId = data.orgId || await inferOrgId(data.fromHospitalId, data.toHospitalId);
  const doc: ReferralDoc = {
    _id: `ref-${uuidv4().slice(0, 8)}`,
    type: 'referral',
    ...data,
    orgId,
    createdAt: now,
    updatedAt: now,
  } as ReferralDoc;
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('CREATE_REFERRAL', undefined, undefined, `Referral ${doc._id}: patient ${doc.patientId} to ${doc.toHospital}`).catch(() => {});
  return doc;
}

export async function getReferralsByPatient(patientId: string): Promise<ReferralDoc[]> {
  const all = await getAllReferrals();
  return all.filter(r => r.patientId === patientId);
}

export async function createReferralWithTransfer(
  data: Omit<ReferralDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'transferPackage' | 'referralAttachments'>,
  referralAttachments: Attachment[],
  packagedBy: string
): Promise<ReferralDoc> {
  const transferPackage = await assembleTransferPackage(data.patientId, packagedBy);

  // Add referral-specific attachments to the package size
  const extraSize = referralAttachments.reduce((sum, a) => sum + a.sizeBytes, 0);
  transferPackage.packageSizeBytes += extraSize;

  const db = referralsDB();
  const now = new Date().toISOString();
  const orgId = data.orgId || await inferOrgId(data.fromHospitalId, data.toHospitalId);
  const doc: ReferralDoc = {
    _id: `ref-${uuidv4().slice(0, 8)}`,
    type: 'referral',
    ...data,
    orgId,
    transferPackage,
    referralAttachments: referralAttachments.length > 0 ? referralAttachments : undefined,
    createdAt: now,
    updatedAt: now,
  } as ReferralDoc;
  const resp2 = await db.put(doc);
  doc._rev = resp2.rev;
  return doc;
}

export async function updateReferralStatus(
  id: string,
  status: 'sent' | 'received' | 'seen' | 'completed' | 'cancelled'
): Promise<ReferralDoc | null> {
  const db = referralsDB();
  try {
    const existing = await db.get(id) as ReferralDoc;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    logAudit('UPDATE_REFERRAL', undefined, undefined, `Referral ${id} status changed to ${status}`).catch(() => {});
    return updated;
  } catch {
    return null;
  }
}

export async function updateReferralNotes(
  id: string,
  notes: string
): Promise<ReferralDoc | null> {
  const db = referralsDB();
  try {
    const existing = await db.get(id) as ReferralDoc;
    const updated = { ...existing, notes, updatedAt: new Date().toISOString() };
    const resp = await db.put(updated);
    updated._rev = resp.rev;
    logAudit('UPDATE_REFERRAL', undefined, undefined, `Referral ${id} notes updated`).catch(() => {});
    return updated;
  } catch {
    return null;
  }
}

/**
 * Accept a referral: update status to 'seen' AND transfer the patient
 * to the receiving hospital so they appear in that hospital's patient list.
 */
export async function acceptReferral(referralId: string): Promise<ReferralDoc | null> {
  const db = referralsDB();
  try {
    const referral = await db.get(referralId) as ReferralDoc;
    // Update referral status
    const updated = { ...referral, status: 'seen' as const, updatedAt: new Date().toISOString() };
    const resp = await db.put(updated);
    updated._rev = resp.rev;

    // Transfer patient to the receiving hospital
    if (referral.patientId && referral.toHospitalId) {
      try {
        const { updatePatient } = await import('./patient-service');
        await updatePatient(referral.patientId, {
          registrationHospital: referral.toHospitalId,
          lastVisitHospital: referral.toHospitalId,
        });
        logAudit(
          'ACCEPT_REFERRAL', undefined, undefined,
          `Accepted referral ${referralId}: patient ${referral.patientId} transferred to ${referral.toHospital}`
        ).catch(() => {});
      } catch (err) {
        console.error('Failed to transfer patient on referral acceptance:', err);
      }
    }

    return updated;
  } catch {
    return null;
  }
}
