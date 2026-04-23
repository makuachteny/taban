import { getAllBirths, getBirthStats } from './birth-service';
import { getAllDeaths, getDeathStats } from './death-service';
import { getAllAssessments } from './facility-assessment-service';
import { getNationalDataQuality } from './data-quality-service';
import { hospitalsDB, patientsDB, referralsDB, diseaseAlertsDB, labResultsDB, prescriptionsDB, immunizationsDB, ancDB } from '../db';
import type { HospitalDoc, PatientDoc, ReferralDoc, DiseaseAlertDoc, LabResultDoc, PrescriptionDoc, ImmunizationDoc, ANCVisitDoc } from '../db-types';

export interface DHIS2DataSet {
  exportDate: string;
  period: string;
  orgUnit: string;
  dataValues: DHIS2DataValue[];
}

export interface DHIS2DataValue {
  dataElement: string;
  category: string;
  value: string;
  period: string;
  orgUnit: string;
}

export async function generateDHIS2Export(period: string): Promise<DHIS2DataSet> {
  const now = new Date().toISOString();

  // Gather all data
  const hDB = hospitalsDB();
  const hResult = await hDB.allDocs({ include_docs: true });
  const hospitals = hResult.rows.map(r => r.doc as HospitalDoc).filter(d => d?.type === 'hospital');

  const pDB = patientsDB();
  const pResult = await pDB.allDocs({ include_docs: true });
  const patients = pResult.rows.map(r => r.doc as PatientDoc).filter(d => d?.type === 'patient');

  const rDB = referralsDB();
  const rResult = await rDB.allDocs({ include_docs: true });
  const referrals = rResult.rows.map(r => r.doc as ReferralDoc).filter(d => d?.type === 'referral');

  const daDB = diseaseAlertsDB();
  const daResult = await daDB.allDocs({ include_docs: true });
  const alerts = daResult.rows.map(r => r.doc as DiseaseAlertDoc).filter(d => d?.type === 'disease_alert');

  const birthStats = await getBirthStats();
  const deathStats = await getDeathStats();
  const births = await getAllBirths();
  const deaths = await getAllDeaths();
  const assessments = await getAllAssessments();
  const dataQuality = await getNationalDataQuality();

  // Lab data
  const labDB = labResultsDB();
  const labResult = await labDB.allDocs({ include_docs: true });
  const labResults = labResult.rows.map(r => r.doc as LabResultDoc).filter(d => d?.type === 'lab_result');

  // Prescription data
  const rxDB = prescriptionsDB();
  const rxResult = await rxDB.allDocs({ include_docs: true });
  const prescriptions = rxResult.rows.map(r => r.doc as PrescriptionDoc).filter(d => d?.type === 'prescription');

  // Immunization data
  const immDB = immunizationsDB();
  const immResult = await immDB.allDocs({ include_docs: true });
  const immunizations = immResult.rows.map(r => r.doc as ImmunizationDoc).filter(d => d?.type === 'immunization');

  // ANC data
  const ancDatabase = ancDB();
  const ancResult = await ancDatabase.allDocs({ include_docs: true });
  const ancVisits = ancResult.rows.map(r => r.doc as ANCVisitDoc).filter(d => d?.type === 'anc_visit');

  const dataValues: DHIS2DataValue[] = [];

  // Population health indicators
  dataValues.push(
    { dataElement: 'TOTAL_HOSPITALS', category: 'default', value: hospitals.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_PATIENTS', category: 'default', value: patients.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_BEDS', category: 'default', value: hospitals.reduce((s, h) => s + h.totalBeds, 0).toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_DOCTORS', category: 'default', value: hospitals.reduce((s, h) => s + h.doctors, 0).toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_NURSES', category: 'default', value: hospitals.reduce((s, h) => s + h.nurses, 0).toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_CLINICAL_OFFICERS', category: 'default', value: hospitals.reduce((s, h) => s + h.clinicalOfficers, 0).toString(), period, orgUnit: 'SS' },
  );

  // CRVS indicators
  dataValues.push(
    { dataElement: 'BIRTHS_REGISTERED', category: 'default', value: birthStats.total.toString(), period, orgUnit: 'SS' },
    { dataElement: 'BIRTHS_MALE', category: 'male', value: birthStats.byGender.male.toString(), period, orgUnit: 'SS' },
    { dataElement: 'BIRTHS_FEMALE', category: 'female', value: birthStats.byGender.female.toString(), period, orgUnit: 'SS' },
    { dataElement: 'BIRTHS_CAESAREAN', category: 'default', value: birthStats.byDeliveryType.caesarean.toString(), period, orgUnit: 'SS' },
    { dataElement: 'DEATHS_REGISTERED', category: 'default', value: deathStats.total.toString(), period, orgUnit: 'SS' },
    { dataElement: 'DEATHS_WITH_ICD11', category: 'default', value: deathStats.withICD11Code.toString(), period, orgUnit: 'SS' },
    { dataElement: 'MATERNAL_DEATHS', category: 'default', value: deathStats.maternalDeaths.toString(), period, orgUnit: 'SS' },
    { dataElement: 'UNDER5_DEATHS', category: 'default', value: deathStats.under5Deaths.toString(), period, orgUnit: 'SS' },
    { dataElement: 'NEONATAL_DEATHS', category: 'default', value: deathStats.neonatalDeaths.toString(), period, orgUnit: 'SS' },
    { dataElement: 'DEATH_NOTIFICATION_RATE', category: 'default', value: deathStats.total ? Math.round(deathStats.notified / deathStats.total * 100).toString() : '0', period, orgUnit: 'SS' },
    { dataElement: 'DEATH_REGISTRATION_RATE', category: 'default', value: deathStats.total ? Math.round(deathStats.registered / deathStats.total * 100).toString() : '0', period, orgUnit: 'SS' },
  );

  // Disease surveillance
  dataValues.push(
    { dataElement: 'ACTIVE_DISEASE_ALERTS', category: 'default', value: alerts.filter(a => a.alertLevel === 'emergency' || a.alertLevel === 'warning').length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'TOTAL_REFERRALS', category: 'default', value: referrals.length.toString(), period, orgUnit: 'SS' },
  );

  // Lab indicators
  const labCompleted = labResults.filter(l => l.status === 'completed').length;
  const labPending = labResults.filter(l => l.status === 'pending').length;
  const labInProgress = labResults.filter(l => l.status === 'in_progress').length;
  const labCritical = labResults.filter(l => l.critical).length;
  dataValues.push(
    { dataElement: 'LAB_TESTS_TOTAL', category: 'default', value: labResults.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'LAB_TESTS_COMPLETED', category: 'default', value: labCompleted.toString(), period, orgUnit: 'SS' },
    { dataElement: 'LAB_TESTS_PENDING', category: 'default', value: labPending.toString(), period, orgUnit: 'SS' },
    { dataElement: 'LAB_TESTS_IN_PROGRESS', category: 'default', value: labInProgress.toString(), period, orgUnit: 'SS' },
    { dataElement: 'LAB_CRITICAL_RESULTS', category: 'default', value: labCritical.toString(), period, orgUnit: 'SS' },
  );

  // Prescription indicators
  const rxDispensed = prescriptions.filter(p => p.status === 'dispensed').length;
  const rxPending = prescriptions.filter(p => p.status === 'pending').length;
  dataValues.push(
    { dataElement: 'PRESCRIPTIONS_TOTAL', category: 'default', value: prescriptions.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'PRESCRIPTIONS_DISPENSED', category: 'default', value: rxDispensed.toString(), period, orgUnit: 'SS' },
    { dataElement: 'PRESCRIPTIONS_PENDING', category: 'default', value: rxPending.toString(), period, orgUnit: 'SS' },
  );

  // Immunization indicators
  const bcgCompleted = immunizations.filter(i => i.vaccine === 'BCG' && i.status === 'completed').length;
  const penta3Completed = immunizations.filter(i => i.vaccine === 'Penta' && i.doseNumber === 3 && i.status === 'completed').length;
  const measles1Completed = immunizations.filter(i => i.vaccine === 'Measles' && i.doseNumber === 1 && i.status === 'completed').length;
  const immDefaulters = immunizations.filter(i => i.status === 'overdue' || i.status === 'missed').length;
  const uniqueChildren = new Set(immunizations.map(i => i.patientId)).size;
  dataValues.push(
    { dataElement: 'IMM_CHILDREN_TOTAL', category: 'default', value: uniqueChildren.toString(), period, orgUnit: 'SS' },
    { dataElement: 'IMM_BCG_COMPLETED', category: 'default', value: bcgCompleted.toString(), period, orgUnit: 'SS' },
    { dataElement: 'IMM_PENTA3_COMPLETED', category: 'default', value: penta3Completed.toString(), period, orgUnit: 'SS' },
    { dataElement: 'IMM_MEASLES1_COMPLETED', category: 'default', value: measles1Completed.toString(), period, orgUnit: 'SS' },
    { dataElement: 'IMM_DEFAULTERS', category: 'default', value: immDefaulters.toString(), period, orgUnit: 'SS' },
    { dataElement: 'IMM_BCG_COVERAGE', category: 'default', value: uniqueChildren > 0 ? Math.round(bcgCompleted / uniqueChildren * 100).toString() : '0', period, orgUnit: 'SS' },
    { dataElement: 'IMM_PENTA3_COVERAGE', category: 'default', value: uniqueChildren > 0 ? Math.round(penta3Completed / uniqueChildren * 100).toString() : '0', period, orgUnit: 'SS' },
    { dataElement: 'IMM_MEASLES1_COVERAGE', category: 'default', value: uniqueChildren > 0 ? Math.round(measles1Completed / uniqueChildren * 100).toString() : '0', period, orgUnit: 'SS' },
  );

  // ANC indicators
  const uniqueMothers = new Set(ancVisits.map(a => a.motherId)).size;
  const anc4Plus = new Map<string, number>();
  ancVisits.forEach(a => {
    anc4Plus.set(a.motherId, (anc4Plus.get(a.motherId) || 0) + 1);
  });
  const mothersWithANC4Plus = [...anc4Plus.values()].filter(v => v >= 4).length;
  const highRiskMothers = new Set(ancVisits.filter(a => a.riskLevel === 'high').map(a => a.motherId)).size;
  dataValues.push(
    { dataElement: 'ANC_MOTHERS_TOTAL', category: 'default', value: uniqueMothers.toString(), period, orgUnit: 'SS' },
    { dataElement: 'ANC_VISITS_TOTAL', category: 'default', value: ancVisits.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'ANC_4PLUS_VISITS', category: 'default', value: mothersWithANC4Plus.toString(), period, orgUnit: 'SS' },
    { dataElement: 'ANC_HIGH_RISK', category: 'default', value: highRiskMothers.toString(), period, orgUnit: 'SS' },
  );

  // Data quality indicators (from WHO report)
  dataValues.push(
    { dataElement: 'REPORTING_COMPLETENESS', category: 'default', value: dataQuality.avgCompleteness.toString(), period, orgUnit: 'SS' },
    { dataElement: 'REPORTING_TIMELINESS', category: 'default', value: dataQuality.avgTimeliness.toString(), period, orgUnit: 'SS' },
    { dataElement: 'DATA_QUALITY_SCORE', category: 'default', value: dataQuality.avgQuality.toString(), period, orgUnit: 'SS' },
    { dataElement: 'DHIS2_ADOPTION_RATE', category: 'default', value: dataQuality.dhis2Adoption.toString(), period, orgUnit: 'SS' },
    { dataElement: 'FACILITIES_ASSESSED', category: 'default', value: assessments.length.toString(), period, orgUnit: 'SS' },
    { dataElement: 'HIS_WORKFORCE', category: 'default', value: dataQuality.totalHISStaff.toString(), period, orgUnit: 'SS' },
  );

  // Per-facility births/deaths
  for (const h of hospitals) {
    const fBirths = births.filter(b => b.facilityId === h._id).length;
    const fDeaths = deaths.filter(d => d.facilityId === h._id).length;
    if (fBirths > 0) dataValues.push({ dataElement: 'FACILITY_BIRTHS', category: 'default', value: fBirths.toString(), period, orgUnit: h._id });
    if (fDeaths > 0) dataValues.push({ dataElement: 'FACILITY_DEATHS', category: 'default', value: fDeaths.toString(), period, orgUnit: h._id });
  }

  return {
    exportDate: now,
    period,
    orgUnit: 'SS',
    dataValues,
  };
}

export function exportToJSON(dataset: DHIS2DataSet): string {
  return JSON.stringify(dataset, null, 2);
}

/**
 * Push a generated dataset to the configured DHIS2 server.
 * Reads NEXT_PUBLIC_DHIS2_BASE_URL (e.g. https://hmis.southsudan.health) and
 * sends the dataset as a `dataValueSets` POST. Returns a structured outcome
 * so the UI can show "queued for retry" on a flaky network without a
 * try/catch wrapper at every call site.
 */
export interface DHIS2PushResult {
  ok: boolean;
  status: 'pushed' | 'queued' | 'unconfigured' | 'failed';
  pushed?: number;
  message: string;
}

export async function pushDataSetToDHIS2(
  dataset: DHIS2DataSet,
  options: { baseUrl?: string; authHeader?: string; signal?: AbortSignal } = {},
): Promise<DHIS2PushResult> {
  const baseUrl = options.baseUrl
    || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DHIS2_BASE_URL : '')
    || '';
  if (!baseUrl) {
    return {
      ok: true,
      status: 'unconfigured',
      message: 'No DHIS2 server configured (NEXT_PUBLIC_DHIS2_BASE_URL unset). Export prepared locally — sync when online.',
    };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: true,
      status: 'queued',
      message: 'Offline — sync queued for retry when network returns.',
    };
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/dataValueSets`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.authHeader ? { Authorization: options.authHeader } : {}),
      },
      body: JSON.stringify({
        period: dataset.period,
        orgUnit: dataset.orgUnit,
        completeDate: dataset.exportDate,
        dataValues: dataset.dataValues,
      }),
      signal: options.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        ok: false,
        status: 'failed',
        message: `DHIS2 server responded ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`,
      };
    }
    return {
      ok: true,
      status: 'pushed',
      pushed: dataset.dataValues?.length ?? 0,
      message: `Pushed ${dataset.dataValues?.length ?? 0} data values to DHIS2.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      message: `Network error: ${(err as Error).message}`,
    };
  }
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportToCSV(dataset: DHIS2DataSet): string {
  const header = 'dataElement,category,value,period,orgUnit';
  const rows = dataset.dataValues.map(v =>
    [v.dataElement, v.category, v.value, v.period, v.orgUnit].map(escapeCSV).join(',')
  );
  return [header, ...rows].join('\n');
}
