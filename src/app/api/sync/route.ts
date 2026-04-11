/**
 * CouchDB → PostgreSQL Sync Webhook
 *
 * This endpoint receives CouchDB _changes feed notifications and upserts
 * the corresponding documents into PostgreSQL for national analytics.
 *
 * Deployment: Configure CouchDB to POST changes to this endpoint, or use
 * a worker process that polls _changes and calls this route.
 *
 * POST /api/sync
 * Body: { db: string, changes: Array<{ id, seq, doc, deleted }> }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, upsertDocument, deleteDocument } from '@/lib/db/postgres';

/**
 * Constant-time comparison of two strings. Prevents timing side-channels
 * that would otherwise leak the signature byte-by-byte.
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = new Uint8Array(Buffer.from(a, 'utf8'));
  const bufB = new Uint8Array(Buffer.from(b, 'utf8'));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify the CouchDB webhook signature. We require a dedicated
 * COUCHDB_WEBHOOK_SECRET (separate from the admin password) and compute
 * HMAC-SHA256 over the raw request body. Fails closed: any missing env
 * variable or signature mismatch returns false.
 */
function verifyWebhookSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.COUCHDB_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) {
    console.error('[Sync] COUCHDB_WEBHOOK_SECRET not set or too short (<32 chars)');
    return false;
  }
  if (!header) return false;

  // Accept header forms: "sha256=<hex>" or just "<hex>"
  const provided = header.startsWith('sha256=') ? header.slice('sha256='.length) : header;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return timingSafeEqualStrings(provided, expected);
}

// Map CouchDB database names to PostgreSQL table names
const DB_TABLE_MAP: Record<string, string> = {
  taban_patients: 'patients',
  taban_hospitals: 'hospitals',
  taban_medical_records: 'medical_records',
  taban_lab_results: 'lab_results',
  taban_referrals: 'referrals',
  taban_disease_alerts: 'disease_alerts',
  taban_prescriptions: 'prescriptions',
  taban_births: 'births',
  taban_deaths: 'deaths',
  taban_immunizations: 'immunizations',
  taban_anc: 'anc_visits',
  taban_boma_visits: 'boma_visits',
  taban_facility_assessments: 'facility_assessments',
  taban_audit_log: 'audit_log',
  taban_organizations: 'organizations',
};

// Map CouchDB doc fields to PostgreSQL column names per table
type FieldMapper = (doc: Record<string, unknown>) => Record<string, unknown>;

const FIELD_MAPPERS: Record<string, FieldMapper> = {
  patients: (doc) => ({
    id: doc._id,
    hospital_number: doc.hospitalNumber,
    name: doc.name,
    gender: doc.gender,
    date_of_birth: doc.dateOfBirth,
    age: doc.age,
    state: doc.state,
    county: doc.county,
    hospital_id: doc.hospitalId,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  hospitals: (doc) => ({
    id: doc._id,
    name: doc.name,
    facility_type: doc.facilityType,
    facility_level: doc.facilityLevel,
    state: doc.state,
    county: doc.county,
    latitude: doc.latitude,
    longitude: doc.longitude,
    total_beds: doc.totalBeds,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  medical_records: (doc) => ({
    id: doc._id,
    patient_id: doc.patientId,
    hospital_id: doc.hospitalId,
    record_type: doc.recordType,
    diagnosis: doc.diagnosis,
    icd11_code: doc.icd11Code,
    severity: doc.severity,
    visit_date: doc.visitDate,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  lab_results: (doc) => ({
    id: doc._id,
    patient_id: doc.patientId,
    test_name: doc.testName,
    specimen: doc.specimen,
    status: doc.status,
    result: doc.result,
    abnormal: doc.abnormal,
    critical: doc.critical,
    hospital_id: doc.hospitalId,
    org_id: doc.orgId,
    ordered_at: doc.orderedAt,
    completed_at: doc.completedAt,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  referrals: (doc) => ({
    id: doc._id,
    patient_id: doc.patientId,
    from_hospital_id: doc.fromHospitalId || doc.from,
    to_hospital_id: doc.toHospitalId || doc.to,
    status: doc.status,
    urgency: doc.urgency,
    reason: doc.reason,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  disease_alerts: (doc) => ({
    id: doc._id,
    disease: doc.disease,
    icd11_code: doc.icd11Code,
    severity: doc.severity,
    state: doc.state,
    county: doc.county,
    cases: doc.cases,
    deaths: doc.deaths,
    status: doc.status,
    reported_by: doc.reportedBy,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  prescriptions: (doc) => ({
    id: doc._id,
    patient_id: doc.patientId,
    medication: doc.medication,
    dose: doc.dose,
    status: doc.status,
    hospital_id: doc.hospitalId,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  births: (doc) => ({
    id: doc._id,
    child_first_name: doc.childFirstName,
    child_surname: doc.childSurname,
    child_gender: doc.childGender,
    date_of_birth: doc.dateOfBirth,
    place_of_birth: doc.placeOfBirth,
    facility_id: doc.facilityId,
    facility_name: doc.facilityName,
    mother_name: doc.motherName,
    mother_age: doc.motherAge,
    birth_weight: doc.birthWeight,
    birth_type: doc.birthType,
    delivery_type: doc.deliveryType,
    attended_by: doc.attendedBy,
    state: doc.state,
    county: doc.county,
    certificate_number: doc.certificateNumber,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  deaths: (doc) => ({
    id: doc._id,
    deceased_first_name: doc.deceasedFirstName,
    deceased_surname: doc.deceasedSurname,
    deceased_gender: doc.deceasedGender,
    date_of_birth: doc.dateOfBirth,
    date_of_death: doc.dateOfDeath,
    age_at_death: doc.ageAtDeath,
    place_of_death: doc.placeOfDeath,
    facility_id: doc.facilityId,
    immediate_cause: doc.immediateCause,
    immediate_icd11: doc.immediateICD11,
    underlying_cause: doc.underlyingCause,
    underlying_icd11: doc.underlyingICD11,
    manner_of_death: doc.mannerOfDeath,
    maternal_death: doc.maternalDeath,
    state: doc.state,
    county: doc.county,
    certificate_number: doc.certificateNumber,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  immunizations: (doc) => ({
    id: doc._id,
    patient_id: doc.patientId,
    patient_name: doc.patientName,
    vaccine: doc.vaccine,
    dose_number: doc.doseNumber,
    date_given: doc.dateGiven,
    next_due_date: doc.nextDueDate,
    facility_id: doc.facilityId,
    state: doc.state,
    status: doc.status,
    adverse_reaction: doc.adverseReaction,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  anc_visits: (doc) => ({
    id: doc._id,
    mother_id: doc.motherId,
    mother_name: doc.motherName,
    visit_number: doc.visitNumber,
    visit_date: doc.visitDate,
    gestational_age: doc.gestationalAge,
    risk_level: doc.riskLevel,
    facility_id: doc.facilityId,
    state: doc.state,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  boma_visits: (doc) => ({
    id: doc._id,
    worker_id: doc.workerId,
    worker_name: doc.workerName,
    patient_name: doc.patientName,
    geocode_id: doc.geocodeId,
    chief_complaint: doc.chiefComplaint,
    suspected_condition: doc.suspectedCondition,
    icd11_code: doc.icd11Code,
    action: doc.action,
    outcome: doc.outcome,
    state: doc.state,
    county: doc.county,
    payam: doc.payam,
    boma: doc.boma,
    visit_date: doc.visitDate,
    gps_latitude: doc.gpsLatitude,
    gps_longitude: doc.gpsLongitude,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  facility_assessments: (doc) => ({
    id: doc._id,
    facility_id: doc.facilityId,
    facility_name: doc.facilityName,
    assessment_date: doc.assessmentDate,
    overall_score: doc.overallScore,
    general_equipment_score: doc.generalEquipmentScore,
    diagnostic_capacity_score: doc.diagnosticCapacityScore,
    essential_medicines_score: doc.essentialMedicinesScore,
    staffing_score: doc.staffingScore,
    data_quality_score: doc.dataQualityScore,
    state: doc.state,
    org_id: doc.orgId,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),

  audit_log: (doc) => ({
    id: doc._id,
    action: doc.action,
    user_id: doc.userId,
    username: doc.username,
    details: doc.details,
    success: doc.success,
    org_id: doc.orgId,
    created_at: doc.createdAt,
  }),

  organizations: (doc) => ({
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    org_type: doc.orgType,
    subscription_status: doc.subscriptionStatus,
    subscription_plan: doc.subscriptionPlan,
    is_active: doc.isActive,
    contact_email: doc.contactEmail,
    country: doc.country,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  }),
};

interface ChangeEntry {
  id: string;
  seq: string;
  doc?: Record<string, unknown>;
  deleted?: boolean;
}

interface SyncPayload {
  db: string;
  changes: ChangeEntry[];
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Sync not configured: DATABASE_URL not set' }, { status: 503 });
    }

    // Require a dedicated HMAC-signed webhook secret. Previously this used
    // COUCHDB_ADMIN_PASSWORD as a bearer token, which reused a high-value
    // credential and gave anyone who captured the header full privileges.
    // HMAC over the raw body also prevents replay / tampering.
    const rawBody = await request.text();
    const signature = request.headers.get('x-taban-signature') || request.headers.get('authorization');
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: SyncPayload;
    try {
      body = JSON.parse(rawBody) as SyncPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { db, changes } = body;

    if (!db || !changes || !Array.isArray(changes)) {
      return NextResponse.json({ error: 'Invalid payload: requires db and changes array' }, { status: 400 });
    }

    const table = DB_TABLE_MAP[db];
    if (!table) {
      return NextResponse.json({ error: `Unknown database: ${db}` }, { status: 400 });
    }

    const mapper = FIELD_MAPPERS[table];
    if (!mapper) {
      return NextResponse.json({ error: `No field mapper for table: ${table}` }, { status: 400 });
    }

    let processed = 0;
    let errors = 0;
    let lastSeq = '';

    for (const change of changes) {
      try {
        if (change.deleted) {
          await deleteDocument(table, change.id);
        } else if (change.doc) {
          // Skip design documents
          if (change.id.startsWith('_design/')) continue;

          const mapped = mapper(change.doc);
          // Filter out undefined values
          const cleaned: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(mapped)) {
            if (v !== undefined) cleaned[k] = v;
          }
          await upsertDocument(table, change.id, cleaned);
        }
        processed++;
        lastSeq = change.seq;
      } catch (err) {
        console.error(`[Sync] Error processing ${change.id}:`, err);
        errors++;
      }
    }

    // Update sync metadata with last processed sequence
    if (lastSeq) {
      await query(
        `INSERT INTO sync_metadata (db_name, last_seq, last_synced_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (db_name) DO UPDATE SET last_seq = $2, last_synced_at = NOW()`,
        [db, lastSeq]
      );
    }

    return NextResponse.json({
      ok: true,
      processed,
      errors,
      lastSeq,
    });
  } catch (err) {
    console.error('[Sync] Webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** GET /api/sync — return sync metadata (last sequence per DB) */
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Sync not configured: DATABASE_URL not set' }, { status: 503 });
    }

    const result = await query<{ db_name: string; last_seq: string; last_synced_at: string }>(
      'SELECT db_name, last_seq, last_synced_at FROM sync_metadata ORDER BY db_name'
    );
    return NextResponse.json({ databases: result.rows });
  } catch (err) {
    console.error('[Sync] Status error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
