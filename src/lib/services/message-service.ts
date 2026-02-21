import { messagesDB } from '../db';
import type { MessageDoc } from '../db-types';
import type { DataScope } from './data-scope';
import { filterByScope } from './data-scope';
import { v4 as uuidv4 } from 'uuid';

export async function getAllMessages(scope?: DataScope): Promise<MessageDoc[]> {
  const db = messagesDB();
  const result = await db.allDocs({ include_docs: true });
  const all = result.rows
    .map(r => r.doc as MessageDoc)
    .filter(d => d && d.type === 'message')
    .sort((a, b) => new Date(b.sentAt || '').getTime() - new Date(a.sentAt || '').getTime());
  return scope ? filterByScope(all, scope) : all;
}

export async function getMessagesByPatient(patientId: string): Promise<MessageDoc[]> {
  const all = await getAllMessages();
  return all.filter(m => m.patientId === patientId);
}

export async function getMessagesByDoctor(doctorId: string): Promise<MessageDoc[]> {
  const all = await getAllMessages();
  return all.filter(m => m.fromDoctorId === doctorId);
}

export async function updateMessage(id: string, data: Partial<MessageDoc>): Promise<MessageDoc | null> {
  const db = messagesDB();
  try {
    const existing = await db.get(id) as MessageDoc;
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

export async function deleteMessage(id: string): Promise<boolean> {
  const db = messagesDB();
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    return true;
  } catch {
    return false;
  }
}

export async function createMessage(data: Omit<MessageDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MessageDoc> {
  const db = messagesDB();
  const now = new Date().toISOString();
  const id = `msg-${uuidv4().slice(0, 8)}`;
  const doc: MessageDoc = {
    _id: id,
    type: 'message',
    ...data,
    status: 'sent',
    createdAt: now,
    updatedAt: now,
  };
  const resp = await db.put(doc);
  doc._rev = resp.rev;
  return doc;
}
