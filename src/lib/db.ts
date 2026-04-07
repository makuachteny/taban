import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);

const databases: Record<string, PouchDB.Database> = {};

export function getDB(name: string): PouchDB.Database {
  if (!databases[name]) {
    databases[name] = new PouchDB(name);
  }
  return databases[name];
}

/**
 * Get a PouchDB instance pointing at the remote CouchDB server.
 * Useful for direct server queries or one-off replication outside the sync manager.
 * Returns null if sync is not enabled.
 */
const remoteDatabases: Record<string, PouchDB.Database> = {};

export function getRemoteDB(name: string): PouchDB.Database | null {
  const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';
  const couchdbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL;
  if (!syncEnabled || !couchdbUrl) return null;

  if (!remoteDatabases[name]) {
    const url = `${couchdbUrl.replace(/\/+$/, '')}/${name}`;
    remoteDatabases[name] = new PouchDB(url, { skip_setup: true });
  }
  return remoteDatabases[name];
}

// Typed database accessors
export const usersDB = () => getDB('taban_users');
export const patientsDB = () => getDB('taban_patients');
export const hospitalsDB = () => getDB('taban_hospitals');
export const medicalRecordsDB = () => getDB('taban_medical_records');
export const referralsDB = () => getDB('taban_referrals');
export const labResultsDB = () => getDB('taban_lab_results');
export const diseaseAlertsDB = () => getDB('taban_disease_alerts');
export const prescriptionsDB = () => getDB('taban_prescriptions');
export const auditLogDB = () => getDB('taban_audit_log');
export const messagesDB = () => getDB('taban_messages');
export const birthsDB = () => getDB('taban_births');
export const deathsDB = () => getDB('taban_deaths');
export const facilityAssessmentsDB = () => getDB('taban_facility_assessments');
export const immunizationsDB = () => getDB('taban_immunizations');
export const ancDB = () => getDB('taban_anc');
export const bomaVisitsDB = () => getDB('taban_boma_visits');
export const followUpsDB = () => getDB('taban_follow_ups');
export const organizationsDB = () => getDB('taban_organizations');
export const platformConfigDB = () => getDB('taban_platform_config');
export const appointmentsDB = () => getDB('taban_appointments');
export const telehealthDB = () => getDB('taban_telehealth');

// Bump this version to force a re-seed (destroys all data and re-creates)
export const SEED_VERSION = 15;

export async function isSeeded(): Promise<boolean> {
  try {
    const db = getDB('taban_meta');
    const doc = await db.get('seeded') as { version?: number };
    return doc.version === SEED_VERSION;
  } catch {
    return false;
  }
}

export async function markSeeded(): Promise<void> {
  const db = getDB('taban_meta');
  try {
    // Remove old marker if it exists
    try {
      const existing = await db.get('seeded');
      await db.remove(existing);
    } catch {
      // No existing marker
    }
    await db.put({ _id: 'seeded', version: SEED_VERSION, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e.status === 409) return; // Already marked
    throw err;
  }
}

// Reset all databases (useful for debugging)
export async function resetAllDatabases(): Promise<void> {
  const dbNames = [
    'taban_users', 'taban_patients', 'taban_hospitals',
    'taban_medical_records', 'taban_referrals', 'taban_lab_results',
    'taban_disease_alerts', 'taban_prescriptions', 'taban_audit_log', 'taban_messages',
    'taban_births', 'taban_deaths', 'taban_facility_assessments',
    'taban_immunizations', 'taban_anc', 'taban_boma_visits', 'taban_follow_ups',
    'taban_organizations', 'taban_platform_config',
    'taban_appointments', 'taban_telehealth',
    'taban_meta'
  ];
  for (const name of dbNames) {
    try {
      const db = new PouchDB(name);
      await db.destroy();
    } catch {
      // OK — may not exist yet
    }
  }
  // Clear cached instances AFTER destroying so no concurrent getDB() sees a stale reference
  for (const key of Object.keys(databases)) {
    delete databases[key];
  }
}
