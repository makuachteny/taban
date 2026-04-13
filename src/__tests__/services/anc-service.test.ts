/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for anc-service.ts (Antenatal Care)
 * Covers ANC visit CRUD, risk assessment, and maternal health statistics.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-anc-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createANCVisit,
  getByMother,
  getByFacility,
  getANCStats,
  updateANCVisit,
  deleteANCVisit,
  getHighRiskPregnancies,
} from '@/lib/services/anc-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

function validANCVisit(overrides: Record<string, unknown> = {}) {
  return {
    motherId: 'mother-001',
    motherName: 'Nyabol Deng',
    motherAge: 24,
    gravida: 2,
    parity: 1,
    visitNumber: 1,
    visitDate: '2026-03-15',
    gestationalAge: 12,
    facilityId: 'hosp-001',
    facilityName: 'Taban Hospital',
    state: 'Central Equatoria',
    bloodPressure: '120/80',
    weight: 58,
    fundalHeight: 12,
    fetalHeartRate: 140,
    hemoglobin: 11.5,
    urineProtein: 'negative',
    bloodGroup: 'O',
    rhFactor: 'positive',
    hivStatus: 'negative',
    malariaTest: 'negative',
    syphilisTest: 'negative',
    ironFolateGiven: true,
    tetanusVaccine: true,
    iptpDose: 1,
    riskFactors: [],
    riskLevel: 'low' as const,
    birthPlan: { facility: 'Taban Hospital', transport: 'boda-boda', bloodDonor: 'husband' },
    nextVisitDate: '2026-04-15',
    notes: 'Normal first ANC visit',
    attendedBy: 'nurse-001',
    attendedByRole: 'nurse',
    ...overrides,
  };
}

describe('ANC Service', () => {
  test('creates an ANC visit', async () => {
    const visit = await createANCVisit(validANCVisit() as any);
    expect(visit._id).toMatch(/^anc-/);
    expect(visit.type).toBe('anc_visit');
    expect(visit.motherName).toBe('Nyabol Deng');
    expect(visit.visitNumber).toBe(1);
    expect(visit.riskLevel).toBe('low');
  });

  test('creates visit for high-risk pregnancy', async () => {
    const visit = await createANCVisit(validANCVisit({
      riskLevel: 'high',
      riskFactors: ['eclampsia', 'previous c-section'],
    }) as any);
    expect(visit.riskLevel).toBe('high');
    expect(visit._id).toBeDefined();
  });

  test('retrieves visits by mother', async () => {
    await createANCVisit(validANCVisit({ visitNumber: 1, visitDate: '2026-01-15' }) as any);
    await createANCVisit(validANCVisit({ visitNumber: 2, visitDate: '2026-02-15', gestationalAge: 16 }) as any);
    await createANCVisit(validANCVisit({
      motherId: 'mother-002',
      motherName: 'Ayen Kuol',
      visitNumber: 1,
      visitDate: '2026-03-01',
    }) as any);

    const visits = await getByMother('mother-001');
    expect(visits).toHaveLength(2);
  });

  test('retrieves visits by facility', async () => {
    await createANCVisit(validANCVisit() as any);
    await createANCVisit(validANCVisit({
      motherId: 'mother-002',
      motherName: 'Ayen',
      facilityId: 'hosp-002',
      facilityName: 'Juba Teaching Hospital',
    }) as any);

    const facilityVisits = await getByFacility('hosp-001');
    expect(facilityVisits).toHaveLength(1);
    expect(facilityVisits[0].facilityName).toBe('Taban Hospital');
  });

  test('updates an ANC visit', async () => {
    const visit = await createANCVisit(validANCVisit() as any);
    const updated = await updateANCVisit(visit._id, {
      bloodPressure: '140/95',
      riskLevel: 'high',
      riskFactors: ['hypertension'],
      notes: 'Elevated BP detected, monitor closely',
    });
    expect(updated).not.toBeNull();
    expect(updated!.bloodPressure).toBe('140/95');
    expect(updated!.riskLevel).toBe('high');
  });

  test('update returns null for nonexistent visit', async () => {
    const result = await updateANCVisit('nonexistent', { notes: 'test' });
    expect(result).toBeNull();
  });

  test('deletes an ANC visit', async () => {
    const visit = await createANCVisit(validANCVisit() as any);
    const deleted = await deleteANCVisit(visit._id);
    expect(deleted).toBe(true);

    const visits = await getByMother('mother-001');
    expect(visits).toHaveLength(0);
  });

  test('delete returns false for nonexistent visit', async () => {
    const result = await deleteANCVisit('nonexistent');
    expect(result).toBe(false);
  });

  test('getHighRiskPregnancies returns latest visit per mother', async () => {
    await createANCVisit(validANCVisit({
      visitNumber: 1,
      visitDate: '2026-01-15',
      riskLevel: 'high',
      riskFactors: ['anemia'],
    }) as any);
    await createANCVisit(validANCVisit({
      visitNumber: 2,
      visitDate: '2026-02-15',
      riskLevel: 'high',
      riskFactors: ['anemia', 'previous PPH'],
    }) as any);
    // Different mother, low risk
    await createANCVisit(validANCVisit({
      motherId: 'mother-002',
      motherName: 'Ayen',
      riskLevel: 'low',
    }) as any);

    const highRisk = await getHighRiskPregnancies();
    expect(highRisk).toHaveLength(1);
    expect(highRisk[0].motherId).toBe('mother-001');
  });

  test('getANCStats returns correct statistics', async () => {
    // Mother 1: 4 visits (ANC4+)
    for (let i = 1; i <= 4; i++) {
      await createANCVisit(validANCVisit({
        visitNumber: i,
        visitDate: `2026-0${i}-15`,
        gestationalAge: 8 + i * 4,
      }) as any);
    }
    // Mother 2: 1 visit, high risk
    await createANCVisit(validANCVisit({
      motherId: 'mother-002',
      motherName: 'Ayen Kuol',
      visitNumber: 1,
      riskLevel: 'high',
      riskFactors: ['eclampsia'],
    }) as any);

    const stats = await getANCStats();
    expect(stats.totalMothers).toBe(2);
    expect(stats.totalVisits).toBe(5);
    expect(stats.anc1).toBe(2);
    expect(stats.anc4Plus).toBe(1);
    expect(stats.highRiskCount).toBeGreaterThanOrEqual(1);
  });
});
