import { hospitalsDB } from '../db';
import type { HospitalDoc } from '../db-types';
import { getAllAssessments } from './facility-assessment-service';

export interface DataCompletenessEntry {
  facilityId: string;
  facilityName: string;
  state: string;
  reportingCompleteness: number;  // 0-100
  reportingTimeliness: number;    // 0-100
  dataQualityScore: number;       // 0-100
  hasDHIS2: boolean;
  hisStaffCount: number;
  lastAssessmentDate: string;
}

export interface NationalDataQuality {
  avgCompleteness: number;
  avgTimeliness: number;
  avgQuality: number;
  facilitiesReporting: number;
  totalFacilities: number;
  completenessRate: number;        // % of facilities with >80% completeness
  dhis2Adoption: number;           // % facilities using DHIS2
  totalHISStaff: number;
  facilitiesWithTrainedStaff: number;
  entries: DataCompletenessEntry[];
}

export async function getNationalDataQuality(): Promise<NationalDataQuality> {
  const hDB = hospitalsDB();
  const hResult = await hDB.allDocs({ include_docs: true });
  const hospitals = hResult.rows
    .map(r => r.doc as HospitalDoc)
    .filter(d => d && d.type === 'hospital');

  const assessments = await getAllAssessments();

  // Latest assessment per facility
  const latestAssessment: Record<string, typeof assessments[0]> = {};
  for (const a of assessments) {
    if (!latestAssessment[a.facilityId] || a.assessmentDate > latestAssessment[a.facilityId].assessmentDate) {
      latestAssessment[a.facilityId] = a;
    }
  }

  const entries: DataCompletenessEntry[] = hospitals.map(h => {
    const assessment = latestAssessment[h._id];
    return {
      facilityId: h._id,
      facilityName: h.name,
      state: h.state,
      reportingCompleteness: assessment?.reportingCompleteness ?? 0,
      reportingTimeliness: assessment?.reportingTimeliness ?? 0,
      dataQualityScore: assessment?.dataQualityScore ?? 0,
      hasDHIS2: assessment?.hasDHIS2Reporting ?? false,
      hisStaffCount: assessment?.hisStaffCount ?? 0,
      lastAssessmentDate: assessment?.assessmentDate ?? '',
    };
  });

  const assessed = entries.filter(e => e.lastAssessmentDate);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  return {
    avgCompleteness: avg(assessed.map(e => e.reportingCompleteness)),
    avgTimeliness: avg(assessed.map(e => e.reportingTimeliness)),
    avgQuality: avg(assessed.map(e => e.dataQualityScore)),
    facilitiesReporting: assessed.length,
    totalFacilities: hospitals.length,
    completenessRate: assessed.length ? Math.round(assessed.filter(e => e.reportingCompleteness >= 80).length / assessed.length * 100) : 0,
    dhis2Adoption: assessed.length ? Math.round(assessed.filter(e => e.hasDHIS2).length / hospitals.length * 100) : 0,
    totalHISStaff: assessed.reduce((s, e) => s + e.hisStaffCount, 0),
    facilitiesWithTrainedStaff: assessed.filter(e => e.hisStaffCount > 0).length,
    entries: entries.sort((a, b) => b.reportingCompleteness - a.reportingCompleteness),
  };
}
