/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for boma-visit-service.ts (Community Health Worker visits)
 * Covers visit CRUD, review workflows, and BHW performance tracking.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-boma-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createBomaVisit,
  getAllBomaVisits,
  getVisitsByWorker,
  getVisitsByPatient,
  getTodaysVisits,
  updateBomaVisit,
  getVisitsForReview,
  reviewVisit,
  getReviewStats,
  getBHWPerformance,
  getBomaStats,
} from '@/lib/services/boma-visit-service';

afterEach(async () => { await teardownTestDBs(); uuidCounter = 0; });

const today = new Date().toISOString().slice(0, 10);

function validBomaVisit(overrides: Record<string, unknown> = {}) {
  return {
    workerId: 'bhw-001',
    workerName: 'Mary Ayen',
    assignedBoma: 'Gudele-3',
    geocodeId: 'BOMA-GUD3-HH042',
    patientName: 'Deng Mabior',
    patientAge: 45,
    patientGender: 'male',
    visitDate: today,
    chiefComplaint: 'Fever and body aches for 2 days',
    suspectedCondition: 'Malaria',
    icd11Code: '1F40',
    action: 'treated' as const,
    treatmentGiven: 'ACT (Artemether-Lumefantrine)',
    outcome: 'follow_up' as const,
    followUpRequired: true,
    nextFollowUp: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
    reviewStatus: 'pending' as const,
    state: 'Central Equatoria',
    county: 'Juba',
    payam: 'Northern Bari',
    boma: 'Gudele-3',
    ...overrides,
  };
}

describe('Boma Visit Service', () => {
  test('creates a community health visit', async () => {
    const visit = await createBomaVisit(validBomaVisit() as any);
    expect(visit._id).toMatch(/^boma-visit-/);
    expect(visit.type).toBe('boma_visit');
    expect(visit.workerName).toBe('Mary Ayen');
    expect(visit.suspectedCondition).toBe('Malaria');
  });

  test('retrieves all visits', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH043',
      patientName: 'Achol Atem',
    }) as any);

    const all = await getAllBomaVisits();
    expect(all).toHaveLength(2);
  });

  test('retrieves visits by worker', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      workerId: 'bhw-002',
      workerName: 'James Lual',
      geocodeId: 'BOMA-GUD3-HH050',
      patientName: 'Atem Garang',
    }) as any);

    const workerVisits = await getVisitsByWorker('bhw-001');
    expect(workerVisits).toHaveLength(1);
    expect(workerVisits[0].workerName).toBe('Mary Ayen');
  });

  test('retrieves visits by patient geocode', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      visitDate: new Date(Date.now() - 604800000).toISOString().slice(0, 10),
      chiefComplaint: 'Follow-up for malaria',
    }) as any);

    const patientVisits = await getVisitsByPatient('BOMA-GUD3-HH042');
    expect(patientVisits).toHaveLength(2);
  });

  test('retrieves today\'s visits for a worker', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH044',
      patientName: 'Nyabol',
    }) as any);
    // Past visit
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH045',
      patientName: 'Ayen',
      visitDate: '2026-01-01',
    }) as any);

    const todayVisits = await getTodaysVisits('bhw-001');
    expect(todayVisits).toHaveLength(2);
  });

  test('updates a boma visit', async () => {
    const visit = await createBomaVisit(validBomaVisit() as any);
    const updated = await updateBomaVisit(visit._id, {
      outcome: 'recovered',
      followUpRequired: false,
    });
    expect(updated).not.toBeNull();
    expect(updated!.outcome).toBe('recovered');
    expect(updated!.followUpRequired).toBe(false);
  });

  test('retrieves visits pending review', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH044',
      patientName: 'Atem',
      reviewStatus: 'reviewed',
    }) as any);

    const pending = await getVisitsForReview();
    expect(pending).toHaveLength(1);
    expect(pending[0].reviewStatus).toBe('pending');
  });

  test('filters review by payam', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-KAT1-HH001',
      patientName: 'Kuol',
      payam: 'Kator',
    }) as any);

    const northernBari = await getVisitsForReview('Northern Bari');
    expect(northernBari).toHaveLength(1);
    expect(northernBari[0].payam).toBe('Northern Bari');
  });

  test('reviews a visit', async () => {
    const visit = await createBomaVisit(validBomaVisit() as any);
    const reviewed = await reviewVisit(
      visit._id,
      'supervisor-001',
      'Dr. Garang',
      'reviewed',
      'Appropriate treatment given for suspected malaria'
    );
    expect(reviewed).not.toBeNull();
    expect(reviewed!.reviewStatus).toBe('reviewed');
    expect(reviewed!.reviewedBy).toBe('supervisor-001');
    expect(reviewed!.reviewedByName).toBe('Dr. Garang');
    expect(reviewed!.reviewedAt).toBeDefined();
  });

  test('flags a visit during review', async () => {
    const visit = await createBomaVisit(validBomaVisit({
      suspectedCondition: 'Pneumonia',
      treatmentGiven: 'Paracetamol only',
    }) as any);
    const flagged = await reviewVisit(
      visit._id,
      'supervisor-001',
      'Dr. Garang',
      'flagged',
      'Pneumonia requires amoxicillin, not just paracetamol'
    );
    expect(flagged).not.toBeNull();
    expect(flagged!.reviewStatus).toBe('flagged');
  });

  test('getReviewStats returns correct counts', async () => {
    await createBomaVisit(validBomaVisit() as any); // pending
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH044',
      patientName: 'Atem',
      reviewStatus: 'reviewed',
    }) as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH045',
      patientName: 'Kuol',
      reviewStatus: 'flagged',
    }) as any);

    const stats = await getReviewStats();
    expect(stats.pending).toBe(1);
    expect(stats.reviewed).toBe(1);
    expect(stats.flagged).toBe(1);
    expect(stats.total).toBe(3);
  });

  test('getBHWPerformance tracks worker metrics', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH050',
      patientName: 'Akuol',
      action: 'referred',
      referredTo: 'Taban Hospital',
      treatmentGiven: undefined,
    }) as any);
    await createBomaVisit(validBomaVisit({
      workerId: 'bhw-002',
      workerName: 'James Lual',
      geocodeId: 'BOMA-GUD3-HH060',
      patientName: 'Garang',
    }) as any);

    const performance = await getBHWPerformance();
    expect(performance.length).toBeGreaterThanOrEqual(2);
    const bhw1 = performance.find(p => p.workerId === 'bhw-001');
    expect(bhw1).toBeDefined();
    expect(bhw1!.totalVisits).toBe(2);
    expect(bhw1!.referred).toBe(1);
    expect(bhw1!.treated).toBe(1);
  });

  test('getBomaStats returns worker-level statistics', async () => {
    await createBomaVisit(validBomaVisit() as any);
    await createBomaVisit(validBomaVisit({
      geocodeId: 'BOMA-GUD3-HH044',
      patientName: 'Achol',
      suspectedCondition: 'Diarrhoea',
      action: 'referred',
      referredTo: 'Taban Hospital',
    }) as any);

    const stats = await getBomaStats('bhw-001');
    expect(stats.totalVisits).toBe(2);
    expect(stats.todaysVisits).toBe(2);
    expect(stats.totalReferrals).toBeGreaterThanOrEqual(1);
    expect(stats.uniqueHouseholds).toBeGreaterThanOrEqual(2);
  });
});
