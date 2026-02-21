import { ancDB, birthsDB, deathsDB, immunizationsDB } from '../db';
import type { ANCVisitDoc, BirthRegistrationDoc, DeathRegistrationDoc, ImmunizationDoc } from '../db-types';

// ===== Types =====

export interface ANCCascade {
  anc1: number;          // At least 1 visit
  anc4: number;          // At least 4 visits
  anc8: number;          // At least 8 visits (WHO target)
  anc1Rate: number;      // % of total pregnancies
  anc4Rate: number;
  anc8Rate: number;
  totalPregnancies: number;
  byState: Record<string, { anc1: number; anc4: number; anc8: number; total: number }>;
}

export interface MaternalMortalityData {
  totalMaternalDeaths: number;
  totalLiveBirths: number;
  mmr: number;                    // Maternal Mortality Ratio per 100,000 live births
  pregnancyRelatedDeaths: number;
  directCauses: { cause: string; count: number; percentage: number }[];
  byState: Record<string, { deaths: number; births: number; mmr: number }>;
  byAgeGroup: Record<string, number>;
  trend: { month: string; deaths: number; births: number; mmr: number }[];
}

export interface BirthOutcomeData {
  totalBirths: number;
  liveBirths: number;
  caesareanRate: number;
  lowBirthWeight: number;       // < 2500g
  lowBirthWeightRate: number;
  pretermRate: number;
  averageBirthWeight: number;
  byDeliveryType: Record<string, number>;
  byAttendant: Record<string, number>;
  byBirthType: Record<string, number>;
  facilityDeliveryRate: number;
  byState: Record<string, { total: number; caesarean: number; lowBW: number }>;
  monthlyTrend: { month: string; births: number; caesarean: number; lbw: number }[];
}

export interface NeonatalData {
  totalNeonatalDeaths: number;     // < 28 days
  totalInfantDeaths: number;       // < 1 year
  totalUnder5Deaths: number;
  neonatalMortalityRate: number;   // per 1,000 live births
  infantMortalityRate: number;
  under5MortalityRate: number;
  topCauses: { cause: string; count: number }[];
  byGender: Record<string, number>;
  byState: Record<string, { neonatal: number; infant: number; under5: number }>;
}

export interface ImmunizationGap {
  vaccine: string;
  targetPopulation: number;
  vaccinated: number;
  coverageRate: number;
  gap: number;
  dropoutRate: number;  // e.g. Penta1 → Penta3
  byState: Record<string, { vaccinated: number; total: number; rate: number }>;
}

export interface HighRiskPregnancy {
  motherId: string;
  motherName: string;
  age: number;
  riskFactors: string[];
  riskLevel: 'moderate' | 'high';
  gestationalAge: number;
  visitCount: number;
  lastVisitDate: string;
  facility: string;
  state: string;
  bloodPressure: string;
  hemoglobin: number;
}

export interface MCHAnalyticsData {
  ancCascade: ANCCascade;
  maternalMortality: MaternalMortalityData;
  birthOutcomes: BirthOutcomeData;
  neonatalData: NeonatalData;
  immunizationGaps: ImmunizationGap[];
  highRiskPregnancies: HighRiskPregnancy[];
  summary: {
    totalMothersTracked: number;
    anc4PlusCoverage: number;
    maternalMortalityRatio: number;
    neonatalMortalityRate: number;
    immunizationCoverage: number;
    facilityDeliveryRate: number;
    highRiskCount: number;
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
}

const SOUTH_SUDAN_STATES = [
  'Central Equatoria', 'Eastern Equatoria', 'Western Equatoria',
  'Jonglei', 'Unity', 'Upper Nile', 'Lakes', 'Warrap',
  'Northern Bahr el Ghazal', 'Western Bahr el Ghazal',
];

// ===== Analysis functions =====

function computeANCCascade(visits: ANCVisitDoc[]): ANCCascade {
  const motherVisitCounts = new Map<string, number>();
  const motherStates = new Map<string, string>();

  for (const visit of visits) {
    const current = motherVisitCounts.get(visit.motherId) || 0;
    motherVisitCounts.set(visit.motherId, Math.max(current, visit.visitNumber));
    motherStates.set(visit.motherId, visit.state);
  }

  const totalPregnancies = motherVisitCounts.size;
  let anc1 = 0, anc4 = 0, anc8 = 0;

  const byState: Record<string, { anc1: number; anc4: number; anc8: number; total: number }> = {};
  for (const state of SOUTH_SUDAN_STATES) {
    byState[state] = { anc1: 0, anc4: 0, anc8: 0, total: 0 };
  }

  for (const [motherId, maxVisit] of motherVisitCounts) {
    const state = motherStates.get(motherId) || 'Unknown';
    if (byState[state]) byState[state].total++;

    if (maxVisit >= 1) {
      anc1++;
      if (byState[state]) byState[state].anc1++;
    }
    if (maxVisit >= 4) {
      anc4++;
      if (byState[state]) byState[state].anc4++;
    }
    if (maxVisit >= 8) {
      anc8++;
      if (byState[state]) byState[state].anc8++;
    }
  }

  return {
    anc1,
    anc4,
    anc8,
    anc1Rate: totalPregnancies > 0 ? Math.round((anc1 / totalPregnancies) * 100) : 0,
    anc4Rate: totalPregnancies > 0 ? Math.round((anc4 / totalPregnancies) * 100) : 0,
    anc8Rate: totalPregnancies > 0 ? Math.round((anc8 / totalPregnancies) * 100) : 0,
    totalPregnancies,
    byState,
  };
}

function computeMaternalMortality(deaths: DeathRegistrationDoc[], births: BirthRegistrationDoc[]): MaternalMortalityData {
  const maternalDeaths = deaths.filter(d => d.maternalDeath);
  const pregnancyRelated = deaths.filter(d => d.pregnancyRelated);
  const totalLiveBirths = births.length;

  // MMR per 100,000 live births
  const mmr = totalLiveBirths > 0 ? Math.round((maternalDeaths.length / totalLiveBirths) * 100000) : 0;

  // Direct causes
  const causeCounts: Record<string, number> = {};
  for (const d of maternalDeaths) {
    const cause = d.underlyingCause || d.immediateCause || 'Unknown';
    causeCounts[cause] = (causeCounts[cause] || 0) + 1;
  }
  const directCauses = Object.entries(causeCounts)
    .map(([cause, count]) => ({
      cause,
      count,
      percentage: maternalDeaths.length > 0 ? Math.round((count / maternalDeaths.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // By state
  const byState: Record<string, { deaths: number; births: number; mmr: number }> = {};
  for (const state of SOUTH_SUDAN_STATES) {
    const stateDeaths = maternalDeaths.filter(d => d.state === state).length;
    const stateBirths = births.filter(b => b.state === state).length;
    byState[state] = {
      deaths: stateDeaths,
      births: stateBirths,
      mmr: stateBirths > 0 ? Math.round((stateDeaths / stateBirths) * 100000) : 0,
    };
  }

  // By age group
  const byAgeGroup: Record<string, number> = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };
  for (const d of maternalDeaths) {
    const age = d.ageAtDeath;
    if (age < 18) byAgeGroup['<18']++;
    else if (age < 25) byAgeGroup['18-24']++;
    else if (age < 35) byAgeGroup['25-34']++;
    else if (age < 45) byAgeGroup['35-44']++;
    else byAgeGroup['45+']++;
  }

  // Monthly trend (last 6 months)
  const trend: { month: string; deaths: number; births: number; mmr: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const mDeaths = maternalDeaths.filter(d => d.dateOfDeath.startsWith(monthKey)).length;
    const mBirths = births.filter(b => b.dateOfBirth.startsWith(monthKey)).length;
    trend.push({
      month: monthLabel,
      deaths: mDeaths,
      births: mBirths,
      mmr: mBirths > 0 ? Math.round((mDeaths / mBirths) * 100000) : 0,
    });
  }

  return {
    totalMaternalDeaths: maternalDeaths.length,
    totalLiveBirths,
    mmr,
    pregnancyRelatedDeaths: pregnancyRelated.length,
    directCauses,
    byState,
    byAgeGroup,
    trend,
  };
}

function computeBirthOutcomes(births: BirthRegistrationDoc[]): BirthOutcomeData {
  const totalBirths = births.length;
  const caesarean = births.filter(b => b.deliveryType === 'caesarean').length;
  const lowBW = births.filter(b => b.birthWeight < 2500).length;
  const avgWeight = totalBirths > 0 ? Math.round(births.reduce((s, b) => s + b.birthWeight, 0) / totalBirths) : 0;

  const byDeliveryType: Record<string, number> = {};
  const byAttendant: Record<string, number> = {};
  const byBirthType: Record<string, number> = {};
  for (const b of births) {
    byDeliveryType[b.deliveryType] = (byDeliveryType[b.deliveryType] || 0) + 1;
    byAttendant[b.attendedBy] = (byAttendant[b.attendedBy] || 0) + 1;
    byBirthType[b.birthType] = (byBirthType[b.birthType] || 0) + 1;
  }

  // Facility delivery rate (attended by doctor, midwife, or nurse — case-insensitive)
  const facilityBirths = births.filter(b => {
    const attendant = (b.attendedBy || '').toLowerCase();
    return attendant === 'doctor' || attendant === 'midwife' || attendant === 'nurse';
  }).length;

  // By state
  const byState: Record<string, { total: number; caesarean: number; lowBW: number }> = {};
  for (const state of SOUTH_SUDAN_STATES) {
    const stateBirths = births.filter(b => b.state === state);
    byState[state] = {
      total: stateBirths.length,
      caesarean: stateBirths.filter(b => b.deliveryType === 'caesarean').length,
      lowBW: stateBirths.filter(b => b.birthWeight < 2500).length,
    };
  }

  // Monthly trend
  const monthlyTrend: { month: string; births: number; caesarean: number; lbw: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const mBirths = births.filter(b => b.dateOfBirth.startsWith(monthKey));
    monthlyTrend.push({
      month: monthLabel,
      births: mBirths.length,
      caesarean: mBirths.filter(b => b.deliveryType === 'caesarean').length,
      lbw: mBirths.filter(b => b.birthWeight < 2500).length,
    });
  }

  return {
    totalBirths,
    liveBirths: totalBirths, // All registered births are live
    caesareanRate: totalBirths > 0 ? Math.round((caesarean / totalBirths) * 100) : 0,
    lowBirthWeight: lowBW,
    lowBirthWeightRate: totalBirths > 0 ? Math.round((lowBW / totalBirths) * 100) : 0,
    pretermRate: totalBirths > 0 ? Math.round((lowBW * 0.6 / totalBirths) * 100) : 0, // Estimate
    averageBirthWeight: avgWeight,
    byDeliveryType,
    byAttendant,
    byBirthType,
    facilityDeliveryRate: totalBirths > 0 ? Math.round((facilityBirths / totalBirths) * 100) : 0,
    byState,
    monthlyTrend,
  };
}

function computeNeonatalData(deaths: DeathRegistrationDoc[], births: BirthRegistrationDoc[]): NeonatalData {
  // Neonatal: < 28 days ≈ 0.077 years. ageAtDeath is in years, so use fractional threshold.
  const neonatal = deaths.filter(d => d.ageAtDeath < 0.077);
  const infant = deaths.filter(d => d.ageAtDeath < 1);
  const under5 = deaths.filter(d => d.ageAtDeath < 5);
  const liveBirths = births.length;

  // Top causes
  const causeCounts: Record<string, number> = {};
  for (const d of under5) {
    const cause = d.underlyingCause || d.immediateCause || 'Unknown';
    causeCounts[cause] = (causeCounts[cause] || 0) + 1;
  }
  const topCauses = Object.entries(causeCounts)
    .map(([cause, count]) => ({ cause, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // By gender
  const byGender: Record<string, number> = {
    Male: under5.filter(d => d.deceasedGender === 'Male').length,
    Female: under5.filter(d => d.deceasedGender === 'Female').length,
  };

  // By state
  const byState: Record<string, { neonatal: number; infant: number; under5: number }> = {};
  for (const state of SOUTH_SUDAN_STATES) {
    byState[state] = {
      neonatal: neonatal.filter(d => d.state === state).length,
      infant: infant.filter(d => d.state === state).length,
      under5: under5.filter(d => d.state === state).length,
    };
  }

  return {
    totalNeonatalDeaths: neonatal.length,
    totalInfantDeaths: infant.length,
    totalUnder5Deaths: under5.length,
    neonatalMortalityRate: liveBirths > 0 ? Math.round((neonatal.length / liveBirths) * 1000) : 0,
    infantMortalityRate: liveBirths > 0 ? Math.round((infant.length / liveBirths) * 1000) : 0,
    under5MortalityRate: liveBirths > 0 ? Math.round((under5.length / liveBirths) * 1000) : 0,
    topCauses,
    byGender,
    byState,
  };
}

function analyzeImmunizationGaps(immunizations: ImmunizationDoc[]): ImmunizationGap[] {
  const completed = immunizations.filter(i => i.status === 'completed');
  const allChildren = new Set(immunizations.map(i => i.patientId));
  const totalChildren = allChildren.size;

  const vaccineSchedule = [
    { vaccine: 'BCG', targetDose: 1 },
    { vaccine: 'OPV', targetDose: 3 },
    { vaccine: 'Penta', targetDose: 3 },
    { vaccine: 'PCV', targetDose: 3 },
    { vaccine: 'Rota', targetDose: 2 },
    { vaccine: 'Measles', targetDose: 2 },
    { vaccine: 'Yellow Fever', targetDose: 1 },
    { vaccine: 'Vitamin A', targetDose: 1 },
  ];

  return vaccineSchedule.map(({ vaccine, targetDose }) => {
    const vaccinatedChildren = new Set(
      completed.filter(i => i.vaccine === vaccine && i.doseNumber >= targetDose).map(i => i.patientId)
    );

    // Dropout: dose 1 vs final dose
    const dose1Children = new Set(
      completed.filter(i => i.vaccine === vaccine && i.doseNumber === 1).map(i => i.patientId)
    );
    const dropoutRate = dose1Children.size > 0 && targetDose > 1
      ? Math.round(((dose1Children.size - vaccinatedChildren.size) / dose1Children.size) * 100)
      : 0;

    // By state
    const byState: Record<string, { vaccinated: number; total: number; rate: number }> = {};
    for (const state of SOUTH_SUDAN_STATES) {
      const stateChildren = new Set(immunizations.filter(i => i.state === state).map(i => i.patientId));
      const stateVaccinated = new Set(
        completed.filter(i => i.vaccine === vaccine && i.doseNumber >= targetDose && i.state === state).map(i => i.patientId)
      );
      byState[state] = {
        vaccinated: stateVaccinated.size,
        total: stateChildren.size,
        rate: stateChildren.size > 0 ? Math.round((stateVaccinated.size / stateChildren.size) * 100) : 0,
      };
    }

    return {
      vaccine: `${vaccine}${targetDose > 1 ? targetDose : ''}`,
      targetPopulation: totalChildren,
      vaccinated: vaccinatedChildren.size,
      coverageRate: totalChildren > 0 ? Math.round((vaccinatedChildren.size / totalChildren) * 100) : 0,
      gap: totalChildren - vaccinatedChildren.size,
      dropoutRate: Math.max(0, dropoutRate),
      byState,
    };
  });
}

function identifyHighRiskPregnancies(visits: ANCVisitDoc[]): HighRiskPregnancy[] {
  // Get latest visit per mother
  const motherLatest = new Map<string, ANCVisitDoc>();
  for (const visit of visits) {
    const existing = motherLatest.get(visit.motherId);
    if (!existing || visit.visitNumber > existing.visitNumber) {
      motherLatest.set(visit.motherId, visit);
    }
  }

  const highRisk: HighRiskPregnancy[] = [];
  for (const [, visit] of motherLatest) {
    if (visit.riskLevel === 'high' || visit.riskLevel === 'moderate') {
      const motherVisits = visits.filter(v => v.motherId === visit.motherId);
      highRisk.push({
        motherId: visit.motherId,
        motherName: visit.motherName,
        age: visit.motherAge,
        riskFactors: visit.riskFactors,
        riskLevel: visit.riskLevel as 'moderate' | 'high',
        gestationalAge: visit.gestationalAge,
        visitCount: motherVisits.length,
        lastVisitDate: visit.visitDate,
        facility: visit.facilityName,
        state: visit.state,
        bloodPressure: visit.bloodPressure,
        hemoglobin: visit.hemoglobin,
      });
    }
  }

  return highRisk.sort((a, b) => {
    if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
    if (a.riskLevel !== 'high' && b.riskLevel === 'high') return 1;
    return a.gestationalAge - b.gestationalAge;
  });
}

// ===== Main export =====

export async function getMCHAnalytics(): Promise<MCHAnalyticsData> {
  // Fetch all data in parallel
  const [ancResult, birthResult, deathResult, immResult] = await Promise.all([
    ancDB().allDocs({ include_docs: true }),
    birthsDB().allDocs({ include_docs: true }),
    deathsDB().allDocs({ include_docs: true }),
    immunizationsDB().allDocs({ include_docs: true }),
  ]);

  const visits = ancResult.rows.map(r => r.doc as ANCVisitDoc).filter(d => d?.type === 'anc_visit');
  const births = birthResult.rows.map(r => r.doc as BirthRegistrationDoc).filter(d => d?.type === 'birth');
  const deaths = deathResult.rows.map(r => r.doc as DeathRegistrationDoc).filter(d => d?.type === 'death');
  const immunizations = immResult.rows.map(r => r.doc as ImmunizationDoc).filter(d => d?.type === 'immunization');

  const ancCascade = computeANCCascade(visits);
  const maternalMortality = computeMaternalMortality(deaths, births);
  const birthOutcomes = computeBirthOutcomes(births);
  const neonatalData = computeNeonatalData(deaths, births);
  const immunizationGaps = analyzeImmunizationGaps(immunizations);
  const highRiskPregnancies = identifyHighRiskPregnancies(visits);

  // Compute overall immunization coverage (average of all vaccines)
  const avgImmCoverage = immunizationGaps.length > 0
    ? Math.round(immunizationGaps.reduce((s, g) => s + g.coverageRate, 0) / immunizationGaps.length)
    : 0;

  // Grade
  let score = 0;
  if (ancCascade.anc4Rate >= 50) score += 20;
  else if (ancCascade.anc4Rate >= 30) score += 10;
  if (maternalMortality.mmr < 500) score += 20;
  else if (maternalMortality.mmr < 1000) score += 10;
  if (neonatalData.neonatalMortalityRate < 30) score += 20;
  else if (neonatalData.neonatalMortalityRate < 50) score += 10;
  if (avgImmCoverage >= 80) score += 20;
  else if (avgImmCoverage >= 50) score += 10;
  if (birthOutcomes.facilityDeliveryRate >= 50) score += 20;
  else if (birthOutcomes.facilityDeliveryRate >= 25) score += 10;

  const overallGrade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return {
    ancCascade,
    maternalMortality,
    birthOutcomes,
    neonatalData,
    immunizationGaps,
    highRiskPregnancies,
    summary: {
      totalMothersTracked: ancCascade.totalPregnancies,
      anc4PlusCoverage: ancCascade.anc4Rate,
      maternalMortalityRatio: maternalMortality.mmr,
      neonatalMortalityRate: neonatalData.neonatalMortalityRate,
      immunizationCoverage: avgImmCoverage,
      facilityDeliveryRate: birthOutcomes.facilityDeliveryRate,
      highRiskCount: highRiskPregnancies.filter(h => h.riskLevel === 'high').length,
      overallGrade,
    },
  };
}
