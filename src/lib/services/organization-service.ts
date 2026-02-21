import { organizationsDB } from '../db';
import type { OrganizationDoc } from '../db-types';

export async function getAllOrganizations(): Promise<OrganizationDoc[]> {
  const db = organizationsDB();
  const result = await db.allDocs({ include_docs: true });
  return result.rows
    .map(r => r.doc as OrganizationDoc)
    .filter(d => d && d.type === 'organization');
}

export async function getOrganizationById(id: string): Promise<OrganizationDoc | null> {
  try {
    const db = organizationsDB();
    return await db.get(id) as OrganizationDoc;
  } catch {
    return null;
  }
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationDoc | null> {
  const all = await getAllOrganizations();
  return all.find(o => o.slug === slug) || null;
}

export async function createOrganization(
  data: Omit<OrganizationDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>,
  actorId?: string,
  actorUsername?: string
): Promise<OrganizationDoc> {
  const db = organizationsDB();
  const now = new Date().toISOString();

  const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const existing = await getOrganizationBySlug(slug);
  if (existing) {
    throw new Error(`Organization with slug "${slug}" already exists`);
  }

  const doc: OrganizationDoc = {
    ...data,
    _id: `org-${slug}`,
    type: 'organization',
    slug,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
  };

  const resp = await db.put(doc);
  doc._rev = resp.rev;
  const { logAudit } = await import('./audit-service');
  await logAudit('organization_created', actorId, actorUsername, `Created organization "${data.name}"`, true);
  return doc;
}

export async function updateOrganization(
  id: string,
  data: Partial<Omit<OrganizationDoc, '_id' | '_rev' | 'type' | 'createdAt'>>,
  actorId?: string,
  actorUsername?: string
): Promise<OrganizationDoc> {
  const db = organizationsDB();
  const existing = await db.get(id) as OrganizationDoc;

  const updated: OrganizationDoc = {
    ...existing,
    ...data,
    _id: existing._id,
    _rev: existing._rev,
    updatedAt: new Date().toISOString(),
  };

  const resp = await db.put(updated);
  updated._rev = resp.rev;
  const { logAudit } = await import('./audit-service');
  await logAudit('organization_updated', actorId, actorUsername, `Updated organization "${existing.name}"`, true);
  return updated;
}

export async function deactivateOrganization(
  id: string,
  actorId?: string,
  actorUsername?: string
): Promise<void> {
  const db = organizationsDB();
  const existing = await db.get(id) as OrganizationDoc;

  const updated: OrganizationDoc = {
    ...existing,
    isActive: false,
    updatedAt: new Date().toISOString(),
  };

  await db.put(updated);
  const { logAudit } = await import('./audit-service');
  await logAudit('organization_deactivated', actorId, actorUsername, `Deactivated organization "${existing.name}"`, true);
}

export async function getOrganizationStats(orgId: string): Promise<{
  userCount: number;
  hospitalCount: number;
  patientCount: number;
}> {
  const { usersDB, hospitalsDB, patientsDB } = await import('../db');

  const usersResult = await usersDB().allDocs({ include_docs: true });
  const userCount = usersResult.rows.filter(r => {
    const doc = r.doc as { orgId?: string; type?: string };
    return doc?.type === 'user' && doc?.orgId === orgId;
  }).length;

  const hospitalsResult = await hospitalsDB().allDocs({ include_docs: true });
  const hospitalCount = hospitalsResult.rows.filter(r => {
    const doc = r.doc as { orgId?: string; type?: string };
    return doc?.type === 'hospital' && doc?.orgId === orgId;
  }).length;

  const patientsResult = await patientsDB().allDocs({ include_docs: true });
  const patientCount = patientsResult.rows.filter(r => {
    const doc = r.doc as { orgId?: string; type?: string };
    return doc?.type === 'patient' && doc?.orgId === orgId;
  }).length;

  return { userCount, hospitalCount, patientCount };
}
