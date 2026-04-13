/**
 * PouchDB test helper — provides in-memory database instances for isolated testing.
 * Uses pouchdb-adapter-memory so tests don't touch the filesystem.
 */
import PouchDB from 'pouchdb-browser';
import memoryAdapter from 'pouchdb-adapter-memory';

PouchDB.plugin(memoryAdapter);

// We mock the @/lib/db module to intercept all database accessors
const databases: Record<string, PouchDB.Database> = {};

function getTestDB(name: string): PouchDB.Database {
  if (!databases[name]) {
    databases[name] = new PouchDB(name, { adapter: 'memory' });
  }
  return databases[name];
}

/**
 * Destroy all in-memory databases created during a test.
 * Call this in afterEach / afterAll.
 */
export async function teardownTestDBs(): Promise<void> {
  for (const [name, db] of Object.entries(databases)) {
    try {
      await db.destroy();
    } catch {
      // ignore
    }
    delete databases[name];
  }
}

/**
 * Create the jest mock object for @/lib/db.
 * Usage in test file:
 *   jest.mock('@/lib/db', () => createDBMock());
 */
export function createDBMock() {
  return {
    getDB: (name: string) => getTestDB(`test_${name}`),
    usersDB: () => getTestDB('test_taban_users'),
    patientsDB: () => getTestDB('test_taban_patients'),
    hospitalsDB: () => getTestDB('test_taban_hospitals'),
    medicalRecordsDB: () => getTestDB('test_taban_medical_records'),
    referralsDB: () => getTestDB('test_taban_referrals'),
    labResultsDB: () => getTestDB('test_taban_lab_results'),
    diseaseAlertsDB: () => getTestDB('test_taban_disease_alerts'),
    prescriptionsDB: () => getTestDB('test_taban_prescriptions'),
    auditLogDB: () => getTestDB('test_taban_audit_log'),
    messagesDB: () => getTestDB('test_taban_messages'),
    birthsDB: () => getTestDB('test_taban_births'),
    deathsDB: () => getTestDB('test_taban_deaths'),
    facilityAssessmentsDB: () => getTestDB('test_taban_facility_assessments'),
    immunizationsDB: () => getTestDB('test_taban_immunizations'),
    ancDB: () => getTestDB('test_taban_anc'),
    bomaVisitsDB: () => getTestDB('test_taban_boma_visits'),
    followUpsDB: () => getTestDB('test_taban_follow_ups'),
    organizationsDB: () => getTestDB('test_taban_organizations'),
    platformConfigDB: () => getTestDB('test_taban_platform_config'),
    appointmentsDB: () => getTestDB('test_taban_appointments'),
    telehealthDB: () => getTestDB('test_taban_telehealth'),
    pharmacyInventoryDB: () => getTestDB('test_taban_pharmacy_inventory'),
    triageDB: () => getTestDB('test_taban_triage'),
    billingDB: () => getTestDB('test_taban_billing'),
    feeScheduleDB: () => getTestDB('test_taban_fee_schedule'),
    wardDB: () => getTestDB('test_taban_wards'),
    SEED_VERSION: 12,
    isSeeded: async () => false,
    markSeeded: async () => {},
    resetAllDatabases: async () => {},
  };
}

/**
 * Helper: put a document into a test DB, returning the stored doc.
 */
export async function putDoc<T extends { _id: string }>(
  db: PouchDB.Database,
  doc: T
): Promise<T & { _rev: string }> {
  const resp = await db.put(doc);
  return { ...doc, _rev: resp.rev };
}
