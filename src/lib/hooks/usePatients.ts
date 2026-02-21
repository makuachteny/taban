'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PatientDoc } from '../db-types';

export function usePatients() {
  const [patients, setPatients] = useState<PatientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      const { getAllPatients } = await import('../services/patient-service');
      const data = await getAllPatients();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const search = useCallback(async (query: string) => {
    if (!query) {
      await loadPatients();
      return;
    }
    const { searchPatients } = await import('../services/patient-service');
    const results = await searchPatients(query);
    setPatients(results);
  }, [loadPatients]);

  const create = useCallback(async (data: Omit<PatientDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createPatient } = await import('../services/patient-service');
    const patient = await createPatient(data);
    await loadPatients();
    return patient;
  }, [loadPatients]);

  const update = useCallback(async (id: string, data: Partial<PatientDoc>) => {
    const { updatePatient } = await import('../services/patient-service');
    const patient = await updatePatient(id, data);
    await loadPatients();
    return patient;
  }, [loadPatients]);

  return { patients, loading, error, search, create, update, reload: loadPatients };
}
