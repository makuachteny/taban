/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for billing-service.ts
 * Covers bill creation, payment recording, waivers, and summary statistics.
 */
let uuidCounter = 0;
jest.mock('uuid', () => ({ v4: () => `${String(++uuidCounter).padStart(8, '0')}-test-uuid` }));
jest.mock('@/lib/db', () => require('../helpers/test-db').createDBMock());

import { teardownTestDBs } from '../helpers/test-db';
import {
  createBill,
  getBillById,
  getAllBills,
  getBillsByPatient,
  getUnpaidBills,
  recordPayment,
  waiveBill,
  getBillingSummary,
} from '@/lib/services/billing-service';

const makeBillData = (overrides = {}) => ({
  patientId: 'pat-001',
  patientName: 'Achol Deng',
  hospitalNumber: 'JTH-0001',
  facilityId: 'hosp-001',
  facilityName: 'Juba Teaching Hospital',
  facilityLevel: 'national' as const,
  encounterDate: '2026-04-10',
  items: [
    {
      id: 'item-1',
      category: 'consultation' as const,
      description: 'General consultation',
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
    },
    {
      id: 'item-2',
      category: 'laboratory' as const,
      description: 'Malaria RDT',
      quantity: 1,
      unitPrice: 2000,
      totalPrice: 2000,
    },
  ],
  generatedBy: 'user-001',
  generatedByName: 'Desk Amira',
  state: 'Central Equatoria',
  orgId: 'org-001',
  ...overrides,
});

afterEach(async () => {
  await teardownTestDBs();
  uuidCounter = 0;
});

describe('billing-service', () => {
  test('createBill creates a bill with correct totals', async () => {
    const bill = await createBill(makeBillData());
    expect(bill._id).toMatch(/^bill-/);
    expect(bill.type).toBe('billing');
    expect(bill.subtotal).toBe(7000);
    expect(bill.totalAmount).toBe(7000); // No tax
    expect(bill.balanceDue).toBe(7000);
    expect(bill.status).toBe('pending');
    expect(bill.invoiceNumber).toMatch(/^INV-/);
    expect(bill.items).toHaveLength(2);
    expect(bill.payments).toHaveLength(0);
  });

  test('createBill applies tax correctly', async () => {
    const bill = await createBill(makeBillData({ taxRate: 10 }));
    expect(bill.subtotal).toBe(7000);
    expect(bill.taxAmount).toBe(700);
    expect(bill.totalAmount).toBe(7700);
  });

  test('createBill applies discount correctly', async () => {
    const bill = await createBill(makeBillData({ discount: 1000 }));
    expect(bill.subtotal).toBe(7000);
    expect(bill.totalAmount).toBe(6000);
    expect(bill.balanceDue).toBe(6000);
  });

  test('createBill with insurance coverage', async () => {
    const bill = await createBill(makeBillData({
      insuranceProvider: 'National Insurance',
      insurancePolicyNumber: 'INS-12345',
      insuranceCoveragePercent: 80,
    }));
    expect(bill.insuranceClaimStatus).toBe('submitted');
    expect(bill.amountPaid).toBe(5600); // 80% of 7000
    expect(bill.balanceDue).toBe(1400);
  });

  test('getBillById retrieves a bill', async () => {
    const created = await createBill(makeBillData());
    const found = await getBillById(created._id);
    expect(found).not.toBeNull();
    expect(found!.invoiceNumber).toBe(created.invoiceNumber);
  });

  test('getBillsByPatient filters correctly', async () => {
    await createBill(makeBillData());
    await createBill(makeBillData({ patientId: 'pat-002', patientName: 'Nyabol Kuol' }));
    const bills = await getBillsByPatient('pat-001');
    expect(bills).toHaveLength(1);
    expect(bills[0].patientName).toBe('Achol Deng');
  });

  test('recordPayment updates bill correctly', async () => {
    const bill = await createBill(makeBillData());
    const updated = await recordPayment(
      bill._id, 3000, 'cash', 'user-001', 'Desk Amira', 'REC-001'
    );
    expect(updated).not.toBeNull();
    expect(updated!.amountPaid).toBe(3000);
    expect(updated!.balanceDue).toBe(4000);
    expect(updated!.status).toBe('partial');
    expect(updated!.payments).toHaveLength(1);
    expect(updated!.payments[0].method).toBe('cash');
  });

  test('recordPayment marks bill as paid when fully paid', async () => {
    const bill = await createBill(makeBillData());
    const updated = await recordPayment(
      bill._id, 7000, 'mobile_money', 'user-001', 'Desk Amira', 'MM-TX-123'
    );
    expect(updated!.status).toBe('paid');
    expect(updated!.balanceDue).toBe(0);
  });

  test('waiveBill sets status to waived', async () => {
    const bill = await createBill(makeBillData());
    const waived = await waiveBill(bill._id, 'user-001', 'Desk Amira', 'Patient unable to pay');
    expect(waived!.status).toBe('waived');
    expect(waived!.balanceDue).toBe(0);
    expect(waived!.discountReason).toBe('Patient unable to pay');
  });

  test('getUnpaidBills returns pending and partial bills', async () => {
    await createBill(makeBillData());
    const bill2 = await createBill(makeBillData({ patientId: 'pat-002', patientName: 'Mayen Garang' }));
    await recordPayment(bill2._id, bill2.totalAmount, 'cash', 'user-001', 'Admin');

    const unpaid = await getUnpaidBills();
    expect(unpaid).toHaveLength(1);
    expect(unpaid[0].patientName).toBe('Achol Deng');
  });

  test('getBillingSummary returns correct statistics', async () => {
    await createBill(makeBillData());
    const bill2 = await createBill(makeBillData({ patientId: 'pat-002', patientName: 'Mayen Garang' }));
    await recordPayment(bill2._id, bill2.totalAmount, 'cash', 'user-001', 'Admin');

    const summary = await getBillingSummary();
    expect(summary.billCount).toBe(2);
    expect(summary.paidCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
    expect(summary.totalRevenue).toBe(7000);
    expect(summary.totalOutstanding).toBe(7000);
  });
});
