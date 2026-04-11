/**
 * PostgreSQL Client — server-side only.
 *
 * Uses the `pg` package to connect to the national analytics database.
 * Connection pooling is used for efficiency across API route invocations.
 *
 * NOTE: This module must only be imported in server-side code (API routes,
 * server components). Never import it in client components.
 */

import { Pool, type PoolConfig } from 'pg';

// ============================================================================
// SQL-injection allowlists.
//
// upsertDocument() and deleteDocument() build dynamic SQL where the table and
// column names cannot be parameterized by `pg`. Any identifier that slips
// through becomes executable SQL, so we lock both down to strict allowlists
// populated from the known CouchDB → PostgreSQL schema. Anything not in the
// allowlist is rejected before a query is built.
// ============================================================================

const ALLOWED_TABLES = new Set<string>([
  'patients',
  'hospitals',
  'medical_records',
  'lab_results',
  'referrals',
  'disease_alerts',
  'prescriptions',
  'births',
  'deaths',
  'immunizations',
  'anc_visits',
  'boma_visits',
  'facility_assessments',
  'audit_log',
  'organizations',
  'sync_metadata',
]);

// Union of every column name emitted by the FIELD_MAPPERS in the sync route.
// Any identifier outside this set is refused — so an attacker can't smuggle
// in a column like `x; DROP TABLE patients;--` via a poisoned CouchDB doc.
const ALLOWED_COLUMNS = new Set<string>([
  'id', 'hospital_number', 'name', 'gender', 'date_of_birth', 'age', 'state',
  'county', 'hospital_id', 'org_id', 'created_at', 'updated_at',
  'facility_type', 'facility_level', 'latitude', 'longitude', 'total_beds',
  'patient_id', 'record_type', 'diagnosis', 'icd11_code', 'severity',
  'visit_date', 'test_name', 'specimen', 'status', 'result', 'abnormal',
  'critical', 'ordered_at', 'completed_at', 'from_hospital_id',
  'to_hospital_id', 'urgency', 'reason', 'disease', 'cases', 'deaths',
  'reported_by', 'medication', 'dose', 'child_first_name', 'child_surname',
  'child_gender', 'place_of_birth', 'facility_id', 'facility_name',
  'mother_name', 'mother_age', 'birth_weight', 'birth_type', 'delivery_type',
  'attended_by', 'certificate_number', 'deceased_first_name',
  'deceased_surname', 'deceased_gender', 'date_of_death', 'age_at_death',
  'place_of_death', 'immediate_cause', 'immediate_icd11', 'underlying_cause',
  'underlying_icd11', 'manner_of_death', 'maternal_death', 'patient_name',
  'vaccine', 'dose_number', 'date_given', 'next_due_date', 'adverse_reaction',
  'mother_id', 'visit_number', 'gestational_age', 'risk_level', 'worker_id',
  'worker_name', 'geocode_id', 'chief_complaint', 'suspected_condition',
  'action', 'outcome', 'payam', 'boma', 'gps_latitude', 'gps_longitude',
  'assessment_date', 'overall_score', 'general_equipment_score',
  'diagnostic_capacity_score', 'essential_medicines_score', 'staffing_score',
  'data_quality_score', 'user_id', 'username', 'details', 'success',
  'slug', 'org_type', 'subscription_status', 'subscription_plan', 'is_active',
  'contact_email', 'country', 'db_name', 'last_seq', 'last_synced_at',
]);

// Final defence: every identifier must match a strict pattern. This catches
// anything weird (whitespace, quotes, semicolons, comments) even if it
// somehow gets into an allowlist at build time.
const IDENTIFIER_RE = /^[a-z][a-z0-9_]*$/;

function assertSafeTable(table: string): void {
  if (!IDENTIFIER_RE.test(table) || !ALLOWED_TABLES.has(table)) {
    throw new Error(`[SQL-SAFE] Table '${table}' is not in the allowlist`);
  }
}

function assertSafeColumn(column: string): void {
  if (!IDENTIFIER_RE.test(column) || !ALLOWED_COLUMNS.has(column)) {
    throw new Error(`[SQL-SAFE] Column '${column}' is not in the allowlist`);
  }
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const config: PoolConfig = {
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // SSL in production
      ...(process.env.NODE_ENV === 'production' ? {
        ssl: { rejectUnauthorized: false },
      } : {}),
    };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected pool error:', err);
    });
  }

  return pool;
}

/** Execute a parameterized query */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

/**
 * Upsert a document from CouchDB into the corresponding PostgreSQL table.
 * Table + column identifiers are validated against strict allowlists so that
 * a poisoned CouchDB doc cannot inject executable SQL (the pg driver has no
 * way to parameterize identifiers).
 */
export async function upsertDocument(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  assertSafeTable(table);

  // Build column list and values dynamically — every column must pass the
  // allowlist before it enters the SQL string.
  const columns = Object.keys(data);
  columns.forEach(assertSafeColumn);

  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  // Build SET clause for ON CONFLICT (exclude 'id' from updates)
  const updateColumns = columns.filter(c => c !== 'id');
  const setClauses = updateColumns.map(c => {
    const idx = columns.indexOf(c) + 1;
    return `${c} = $${idx}`;
  });

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (id) DO UPDATE SET
      ${setClauses.join(',\n      ')}
  `;

  // Suppress the 'id' in the row for the parameterized input — same array
  // shape as before, identifiers have been validated above.
  await query(sql, values);
}

/** Delete a document by ID from a table (table name allowlist-validated). */
export async function deleteDocument(table: string, id: string): Promise<void> {
  assertSafeTable(table);
  await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

/** Close the connection pool (for graceful shutdown) */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
