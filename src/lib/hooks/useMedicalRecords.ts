'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MedicalRecordDoc } from '../db-types';

export function useMedicalRecords(patientId?: string) {
  const [records, setRecords] = useState<MedicalRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!patientId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { getRecordsByPatient } = await import('../services/medical-record-service');
      const data = await getRecordsByPatient(patientId);
      setRecords(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const create = useCallback(async (data: Omit<MedicalRecordDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createMedicalRecord } = await import('../services/medical-record-service');
    const record = await createMedicalRecord(data);
    await loadRecords();
    return record;
  }, [loadRecords]);

  return { records, loading, error, create, reload: loadRecords };
}
