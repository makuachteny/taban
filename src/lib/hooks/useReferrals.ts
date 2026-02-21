'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReferralDoc } from '../db-types';
import type { Attachment } from '@/data/mock';

export function useReferrals() {
  const [referrals, setReferrals] = useState<ReferralDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(async () => {
    try {
      setError(null);
      const { getAllReferrals } = await import('../services/referral-service');
      const data = await getAllReferrals();
      setReferrals(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const create = useCallback(async (data: Omit<ReferralDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createReferral } = await import('../services/referral-service');
    const referral = await createReferral(data);
    await loadReferrals();
    return referral;
  }, [loadReferrals]);

  const createWithTransfer = useCallback(async (
    data: Omit<ReferralDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'transferPackage' | 'referralAttachments'>,
    referralAttachments: Attachment[],
    packagedBy: string
  ) => {
    const { createReferralWithTransfer } = await import('../services/referral-service');
    const referral = await createReferralWithTransfer(data, referralAttachments, packagedBy);
    await loadReferrals();
    return referral;
  }, [loadReferrals]);

  const updateStatus = useCallback(async (id: string, status: 'sent' | 'received' | 'seen' | 'completed' | 'cancelled') => {
    const { updateReferralStatus } = await import('../services/referral-service');
    await updateReferralStatus(id, status);
    await loadReferrals();
  }, [loadReferrals]);

  return { referrals, loading, error, create, createWithTransfer, updateStatus, reload: loadReferrals };
}

export function usePatientReferrals(patientId?: string) {
  const [referrals, setReferrals] = useState<ReferralDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(async () => {
    if (!patientId) {
      setReferrals([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { getReferralsByPatient } = await import('../services/referral-service');
      const data = await getReferralsByPatient(patientId);
      setReferrals(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load patient referrals');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  return { referrals, loading, error, reload: loadReferrals };
}
