/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for surveillance-service.ts
 * Covers CRUD operations, alert level filtering, and status management.
 */

let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-surv-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  getAllAlerts,
  getActiveAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from '@/lib/services/surveillance-service';

const makeAlertData = (overrides: Record<string, unknown> = {}) => ({
  disease: 'Malaria',
  state: 'Central Equatoria',
  county: 'Juba',
  cases: 15,
  deaths: 2,
  alertLevel: 'warning' as const,
  reportDate: '2025-03-15',
  trend: 'increasing' as const,
  ...overrides,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('surveillance-service', () => {
  test('getAllAlerts returns empty initially', async () => {
    const alerts = await getAllAlerts();
    expect(alerts).toEqual([]);
  });

  test('createAlert creates with correct fields', async () => {
    const alert = await createAlert(makeAlertData() as any);

    expect(alert._id).toMatch(/^alert-/);
    expect(alert.type).toBe('disease_alert');
    expect(alert.disease).toBe('Malaria');
    expect(alert.reportDate).toBe('2025-03-15');
    expect(alert.county).toBe('Juba');
    expect(alert.cases).toBe(15);
    expect(alert.deaths).toBe(2);
    expect(alert.alertLevel).toBe('warning');
    expect(alert.trend).toBe('increasing');
    expect(alert.createdAt).toBeDefined();
    expect(alert.updatedAt).toBeDefined();
    expect(alert._rev).toBeDefined();
  });

  test('createAlert with emergency alert level', async () => {
    const alert = await createAlert(makeAlertData({ alertLevel: 'emergency', cases: 50 }) as any);
    expect(alert.alertLevel).toBe('emergency');
    expect(alert.cases).toBe(50);
  });

  test('getActiveAlerts filters emergency and warning only', async () => {
    await createAlert(makeAlertData({ alertLevel: 'emergency', disease: 'Ebola' }) as any);
    await createAlert(makeAlertData({ alertLevel: 'warning', disease: 'Cholera' }) as any);
    await createAlert(makeAlertData({ alertLevel: 'normal', disease: 'Typhoid' }) as any);
    await createAlert(makeAlertData({ alertLevel: 'watch', disease: 'Influenza' }) as any);

    const active = await getActiveAlerts();

    expect(active).toHaveLength(2);
    const levels = active.map(a => a.alertLevel);
    expect(levels).toContain('emergency');
    expect(levels).toContain('warning');
  });

  test('updateAlert updates alert level', async () => {
    const alert = await createAlert(makeAlertData({ alertLevel: 'watch' }) as any);
    const updated = await updateAlert(alert._id, { alertLevel: 'emergency' });

    expect(updated).not.toBeNull();
    expect(updated!.alertLevel).toBe('emergency');
    expect(updated!.disease).toBe('Malaria');
  });

  test('updateAlert returns null for non-existent id', async () => {
    const result = await updateAlert('alert-nonexistent', { alertLevel: 'emergency' });
    expect(result).toBeNull();
  });

  test('deleteAlert removes the alert', async () => {
    const alert = await createAlert(makeAlertData() as any);
    const success = await deleteAlert(alert._id);
    expect(success).toBe(true);

    const alerts = await getAllAlerts();
    expect(alerts).toHaveLength(0);
  });

  test('deleteAlert returns false for non-existent id', async () => {
    const success = await deleteAlert('alert-nonexistent');
    expect(success).toBe(false);
  });

  test('getAllAlerts sorts by reportDate descending', async () => {
    await createAlert(makeAlertData({ reportDate: '2025-03-10', disease: 'First' }) as any);
    await createAlert(makeAlertData({ reportDate: '2025-03-20', disease: 'Second' }) as any);
    await createAlert(makeAlertData({ reportDate: '2025-03-15', disease: 'Third' }) as any);

    const all = await getAllAlerts();
    expect(all[0].disease).toBe('Second');
    expect(all[1].disease).toBe('Third');
    expect(all[2].disease).toBe('First');
  });

  test('updateAlert preserves existing fields', async () => {
    const alert = await createAlert(makeAlertData({ disease: 'Malaria', cases: 20 }) as any);
    const updated = await updateAlert(alert._id, { trend: 'decreasing' });

    expect(updated!.disease).toBe('Malaria');
    expect(updated!.cases).toBe(20);
    expect(updated!.trend).toBe('decreasing');
  });

  test('updateAlert updates case and death counts', async () => {
    const alert = await createAlert(makeAlertData({ cases: 10, deaths: 1 }) as any);
    const updated = await updateAlert(alert._id, { cases: 25, deaths: 3 });

    expect(updated!.cases).toBe(25);
    expect(updated!.deaths).toBe(3);
  });

  test('updateAlert updates updatedAt timestamp', async () => {
    const alert = await createAlert(makeAlertData() as any);
    const originalUpdatedAt = alert.updatedAt;

    await new Promise(r => setTimeout(r, 10));

    const updated = await updateAlert(alert._id, { cases: 30 });
    expect(updated!.updatedAt > originalUpdatedAt).toBe(true);
  });

  test('multiple alerts sorted correctly', async () => {
    await createAlert(makeAlertData({ disease: 'Malaria', reportDate: '2025-03-10', cases: 5 }) as any);
    await createAlert(makeAlertData({ disease: 'Malaria', reportDate: '2025-03-15', cases: 15 }) as any);
    await createAlert(makeAlertData({ disease: 'Malaria', reportDate: '2025-03-20', cases: 25 }) as any);

    const all = await getAllAlerts();
    expect(all).toHaveLength(3);
    expect(all[0].cases).toBe(25);
    expect(all[2].cases).toBe(5);
  });
});
