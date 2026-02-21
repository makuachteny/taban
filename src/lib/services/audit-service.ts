import { auditLogDB } from '../db';
import type { AuditLogDoc } from '../db-types';
import { v4 as uuidv4 } from 'uuid';

export async function logAudit(
  action: string,
  userId: string | undefined,
  username: string | undefined,
  details: string,
  success: boolean = true
): Promise<void> {
  const db = auditLogDB();
  const now = new Date().toISOString();
  const doc: AuditLogDoc = {
    _id: `audit-${uuidv4()}`,
    type: 'audit_log',
    action,
    userId,
    username,
    details,
    success,
    createdAt: now,
    updatedAt: now,
  };
  await db.put(doc);
}

export async function getRecentAuditLogs(limit: number = 50): Promise<AuditLogDoc[]> {
  const db = auditLogDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as AuditLogDoc)
    .filter(d => d && d.type === 'audit_log')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}
