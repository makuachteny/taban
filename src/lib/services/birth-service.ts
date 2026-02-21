import { birthsDB } from '../db';
import type { BirthRegistrationDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './audit-service';

export async function getAllBirths(): Promise<BirthRegistrationDoc[]> {
  const db = birthsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as BirthRegistrationDoc)
    .filter(d => d && d.type === 'birth')
    .sort((a, b) => new Date(b.dateOfBirth || '').getTime() - new Date(a.dateOfBirth || '').getTime());
}

export async function getBirthsByFacility(facilityId: string): Promise<BirthRegistrationDoc[]> {
  const all = await getAllBirths();
  return all.filter(b => b.facilityId === facilityId);
}

export async function getBirthsByState(state: string): Promise<BirthRegistrationDoc[]> {
  const all = await getAllBirths();
  return all.filter(b => b.state === state);
}

export async function createBirth(data: Omit<BirthRegistrationDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<BirthRegistrationDoc> {
  const db = birthsDB();
  const now = new Date().toISOString();
  const id = `birth-${uuidv4().slice(0, 8)}`;
  const doc: BirthRegistrationDoc = {
    _id: id,
    type: 'birth',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  logAudit('REGISTER_BIRTH', undefined, undefined, `Registered birth ${doc._id}: ${data.childFirstName} ${data.childSurname}, gender: ${data.childGender}`).catch(() => {});
  return doc;
}

export async function updateBirth(id: string, data: Partial<BirthRegistrationDoc>): Promise<BirthRegistrationDoc | null> {
  const db = birthsDB();
  try {
    const existing = await db.get(id) as BirthRegistrationDoc;
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

export async function deleteBirth(id: string): Promise<boolean> {
  const db = birthsDB();
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    return true;
  } catch {
    return false;
  }
}

export async function getBirthStats() {
  const all = await getAllBirths();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisYear = new Date().getFullYear().toString();
  return {
    total: all.length,
    thisMonth: all.filter(b => (b.dateOfBirth || '').startsWith(thisMonth)).length,
    thisYear: all.filter(b => (b.dateOfBirth || '').startsWith(thisYear)).length,
    byGender: {
      male: all.filter(b => b.childGender === 'Male').length,
      female: all.filter(b => b.childGender === 'Female').length,
    },
    byDeliveryType: {
      normal: all.filter(b => b.deliveryType === 'normal').length,
      caesarean: all.filter(b => b.deliveryType === 'caesarean').length,
      assisted: all.filter(b => b.deliveryType === 'assisted').length,
    },
    byState: all.reduce((acc, b) => { const st = b.state || 'Unknown'; acc[st] = (acc[st] || 0) + 1; return acc; }, {} as Record<string, number>),
  };
}
