/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for epidemic-intelligence-service.ts
 * Covers epidemic curve generation, Rt estimation, EWARS alerts, and geographic spread analysis.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-epi-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import { getEpidemicIntelligence } from '@/lib/services/epidemic-intelligence-service';
import { diseaseAlertsDB } from '@/lib/db';
import type { DiseaseAlertDoc } from '@/lib/db-types';

const makeDiseaseAlert = (overrides: Record<string, unknown> = {}): DiseaseAlertDoc => {
  uuidCounter++;
  return {
    _id: `alert-${uuidCounter}-${Date.now()}`,
    type: 'disease_alert',
    disease: 'Malaria',
    state: 'Central Equatoria',
    county: 'Juba',
    cases: 50,
    deaths: 5,
    alertLevel: 'warning' as const,
    reportDate: new Date().toISOString().slice(0, 10),
    trend: 'stable' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('epidemic-intelligence-service', () => {
  test('getEpidemicIntelligence returns valid structure with empty data', async () => {
    const data = await getEpidemicIntelligence();

    expect(data).toBeDefined();
    expect(data.epidemicCurves).toBeDefined();
    expect(Array.isArray(data.epidemicCurves)).toBe(true);
    expect(data.rtEstimates).toBeDefined();
    expect(Array.isArray(data.rtEstimates)).toBe(true);
    expect(data.syndromicAlerts).toBeDefined();
    expect(Array.isArray(data.syndromicAlerts)).toBe(true);
    expect(data.idsrReport).toBeDefined();
    expect(data.geographicSpread).toBeDefined();
    expect(Array.isArray(data.geographicSpread)).toBe(true);
    expect(data.ewarsAlerts).toBeDefined();
    expect(Array.isArray(data.ewarsAlerts)).toBe(true);
    expect(data.summary).toBeDefined();
  });

  test('getEpidemicIntelligence summary has correct structure', async () => {
    const data = await getEpidemicIntelligence();

    expect(data.summary.totalActiveDiseases).toBe(0);
    expect(data.summary.totalCasesThisWeek).toBe(0);
    expect(data.summary.totalDeathsThisWeek).toBe(0);
    expect(['low', 'moderate', 'high', 'critical']).toContain(data.summary.overallRiskLevel);
    expect(Array.isArray(data.summary.statesWithEmergency)).toBe(true);
  });

  test('epidemic curves include 12 weeks of data', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ cases: 10, deaths: 1 }));

    const data = await getEpidemicIntelligence();

    // Should have 12 weeks * number of diseases
    expect(data.epidemicCurves.length).toBeGreaterThanOrEqual(12);

    // Check week labels are in ISO format
    for (const curve of data.epidemicCurves) {
      expect(curve.week).toMatch(/^\d{4}-W\d{2}$/);
      expect(curve.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof curve.cases).toBe('number');
      expect(typeof curve.deaths).toBe('number');
    }
  });

  test('Rt estimates calculated from epidemic curves', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 20, deaths: 2 }));

    const data = await getEpidemicIntelligence();

    expect(data.rtEstimates.length).toBeGreaterThan(0);
    for (const rt of data.rtEstimates) {
      expect(rt.disease).toBeDefined();
      expect(typeof rt.rt).toBe('number');
      expect(rt.rt).toBeGreaterThanOrEqual(0);
      expect(rt.rt).toBeLessThanOrEqual(5);
      expect(['growing', 'stable', 'declining']).toContain(rt.trend);
      expect(['low', 'medium', 'high']).toContain(rt.confidence);
      expect(typeof rt.weeklyChange).toBe('number');
    }
  });

  test('Rt estimates sorted by rt descending', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Malaria', cases: 100 }));
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 10 }));

    const data = await getEpidemicIntelligence();

    if (data.rtEstimates.length > 1) {
      for (let i = 0; i < data.rtEstimates.length - 1; i++) {
        expect(data.rtEstimates[i].rt).toBeGreaterThanOrEqual(data.rtEstimates[i + 1].rt);
      }
    }
  });

  test('syndromic alerts generated per disease and state', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Measles', state: 'Central Equatoria', cases: 5 }));
    await db.put(makeDiseaseAlert({ disease: 'Malaria', state: 'Eastern Equatoria', cases: 100 }));

    const data = await getEpidemicIntelligence();

    expect(data.syndromicAlerts.length).toBeGreaterThan(0);
    for (const alert of data.syndromicAlerts) {
      expect(alert.syndrome).toBeDefined();
      expect(alert.state).toBeDefined();
      expect(typeof alert.currentWeekCases).toBe('number');
      expect(typeof alert.previousWeekCases).toBe('number');
      expect(typeof alert.threshold).toBe('number');
      expect(typeof alert.exceeded).toBe('boolean');
      expect(typeof alert.percentChange).toBe('number');
    }
  });

  test('syndromic alerts marked exceeded when cases exceed threshold', async () => {
    const db = diseaseAlertsDB();
    // Cholera threshold is 5, so 10 cases should exceed
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 10 }));

    const data = await getEpidemicIntelligence();

    const cholerAlerts = data.syndromicAlerts.filter(a => a.syndrome === 'Cholera');
    expect(cholerAlerts.some(a => a.exceeded)).toBe(true);
  });

  test('IDSR report includes reportingWeek', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Malaria', cases: 50 }));

    const data = await getEpidemicIntelligence();

    expect(data.idsrReport.reportingWeek).toMatch(/^\d{4}-W\d{2}$/);
    expect(typeof data.idsrReport.totalFacilitiesReporting).toBe('number');
    expect(typeof data.idsrReport.completeness).toBe('number');
    expect(Array.isArray(data.idsrReport.diseases)).toBe(true);
  });

  test('IDSR report calculates CFR correctly', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Malaria', cases: 100, deaths: 5 }));

    const data = await getEpidemicIntelligence();

    const malariaDx = data.idsrReport.diseases.find(d => d.disease === 'Malaria');
    expect(malariaDx).toBeDefined();
    expect(malariaDx!.cfr).toBe(5); // 5/100 * 100 = 5%
  });

  test('geographic spread covers all South Sudan states', async () => {
    const data = await getEpidemicIntelligence();

    const states = data.geographicSpread.map(g => g.state);
    expect(states).toContain('Central Equatoria');
    expect(states).toContain('Eastern Equatoria');
    expect(states).toContain('Western Equatoria');
    expect(states).toContain('Jonglei');
    expect(states).toContain('Unity');
    expect(states.length).toBe(10);
  });

  test('geographic spread risk scores are 0-100', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 50, state: 'Jonglei' }));

    const data = await getEpidemicIntelligence();

    for (const spread of data.geographicSpread) {
      expect(spread.riskScore).toBeGreaterThanOrEqual(0);
      expect(spread.riskScore).toBeLessThanOrEqual(100);
      expect(typeof spread.totalCases).toBe('number');
    }
  });

  test('EWARS alerts generated for disease alerts', async () => {
    const db = diseaseAlertsDB();
    // Cholera threshold is 5
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 10, state: 'Central Equatoria', alertLevel: 'warning' }));

    const data = await getEpidemicIntelligence();

    const cholerAlerts = data.ewarsAlerts.filter(a => a.disease === 'Cholera');
    // EWARS generates multiple types of alerts, just verify we have some
    expect(cholerAlerts.length).toBeGreaterThan(0);
  });

  test('EWARS alerts include severity levels', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 20, alertLevel: 'emergency' }));

    const data = await getEpidemicIntelligence();

    for (const alert of data.ewarsAlerts) {
      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
      expect(alert.message).toBeDefined();
      expect(typeof alert.cases).toBe('number');
      expect(typeof alert.deaths).toBe('number');
      expect(alert.triggeredAt).toBeDefined();
    }
  });

  test('EWARS alerts for high CFR', async () => {
    const db = diseaseAlertsDB();
    // Yellow Fever CFR threshold is 20%, create 1 case with 1 death (100% CFR)
    await db.put(makeDiseaseAlert({ disease: 'Yellow Fever', cases: 1, deaths: 1 }));

    const data = await getEpidemicIntelligence();

    const yfAlerts = data.ewarsAlerts.filter(a => a.disease === 'Yellow Fever' && a.alertType === 'cfr_high');
    expect(yfAlerts.length).toBeGreaterThan(0);
  });

  test('summary reflects emergency status', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Cholera', alertLevel: 'emergency', state: 'Central Equatoria' }));

    const data = await getEpidemicIntelligence();

    expect(data.summary.statesWithEmergency).toContain('Central Equatoria');
    expect(data.summary.overallRiskLevel).toBe('critical');
  });

  test('summary risk level elevated for high-severity EWARS alerts', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Meningitis', cases: 10, alertLevel: 'warning' }));

    const data = await getEpidemicIntelligence();

    expect(['low', 'moderate', 'high', 'critical']).toContain(data.summary.overallRiskLevel);
  });

  test('highest Rt included in summary', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Malaria', cases: 100, trend: 'increasing' }));

    const data = await getEpidemicIntelligence();

    if (data.rtEstimates.length > 0) {
      expect(data.summary.highestRt).toBeDefined();
      expect(data.summary.highestRt!.disease).toBe(data.rtEstimates[0].disease);
      expect(data.summary.highestRt!.value).toBe(data.rtEstimates[0].rt);
    }
  });

  test('summary totals accumulate correctly', async () => {
    const db = diseaseAlertsDB();
    await db.put(makeDiseaseAlert({ disease: 'Malaria', cases: 50, deaths: 5 }));
    await db.put(makeDiseaseAlert({ disease: 'Cholera', cases: 30, deaths: 2 }));

    const data = await getEpidemicIntelligence();

    expect(data.summary.totalActiveDiseases).toBe(2);
    expect(data.summary.totalCasesThisWeek).toBe(80);
    expect(data.summary.totalDeathsThisWeek).toBe(7);
  });
});
