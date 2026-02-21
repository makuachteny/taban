/**
 * Sync Configuration — maps each PouchDB database to its CouchDB remote.
 *
 * sync direction:
 *   'both'  – bidirectional live replication (default for most DBs)
 *   'push'  – local → remote only (e.g., audit log)
 *   'pull'  – remote → local only (e.g., platform config pushed by admins)
 */

export type SyncDirection = 'both' | 'push' | 'pull';

export interface DatabaseSyncConfig {
  /** Local PouchDB name (matches db.ts) */
  localName: string;
  /** Sync direction */
  direction: SyncDirection;
  /** If true, sync is scoped to the user's orgId */
  orgScoped: boolean;
}

/** All databases that participate in sync */
export const DATABASE_SYNC_CONFIGS: DatabaseSyncConfig[] = [
  { localName: 'taban_patients',              direction: 'both', orgScoped: true },
  { localName: 'taban_medical_records',       direction: 'both', orgScoped: true },
  { localName: 'taban_referrals',             direction: 'both', orgScoped: true },
  { localName: 'taban_lab_results',           direction: 'both', orgScoped: true },
  { localName: 'taban_prescriptions',         direction: 'both', orgScoped: true },
  { localName: 'taban_disease_alerts',        direction: 'both', orgScoped: false },
  { localName: 'taban_messages',              direction: 'both', orgScoped: true },
  { localName: 'taban_births',                direction: 'both', orgScoped: true },
  { localName: 'taban_deaths',                direction: 'both', orgScoped: true },
  { localName: 'taban_facility_assessments',  direction: 'both', orgScoped: true },
  { localName: 'taban_immunizations',         direction: 'both', orgScoped: true },
  { localName: 'taban_anc',                   direction: 'both', orgScoped: true },
  { localName: 'taban_boma_visits',           direction: 'both', orgScoped: true },
  { localName: 'taban_follow_ups',            direction: 'both', orgScoped: true },
  { localName: 'taban_hospitals',             direction: 'both', orgScoped: true },
  { localName: 'taban_users',                 direction: 'pull', orgScoped: true },
  { localName: 'taban_organizations',         direction: 'pull', orgScoped: false },
  { localName: 'taban_platform_config',       direction: 'pull', orgScoped: false },
  { localName: 'taban_audit_log',             direction: 'push', orgScoped: true },
];

/** Build the full CouchDB remote URL for a given database name */
export function getRemoteUrl(localName: string, couchdbUrl: string): string {
  // Strip trailing slash from base URL
  const base = couchdbUrl.replace(/\/+$/, '');
  return `${base}/${localName}`;
}

/** Check whether sync is enabled via environment variable */
export function isSyncEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_COUCHDB_URL
  );
}

/** Get the configured CouchDB base URL */
export function getCouchDBUrl(): string {
  return process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
}
