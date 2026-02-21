'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HospitalDoc } from '../db-types';

export function useHospitals() {
  const [hospitals, setHospitals] = useState<HospitalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHospitals = useCallback(async () => {
    try {
      setError(null);
      const { getAllHospitals } = await import('../services/hospital-service');
      const data = await getAllHospitals();
      setHospitals(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const create = useCallback(async (
    data: Omit<HospitalDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'lastSync' | 'patientCount' | 'todayVisits'>,
    actorId?: string,
    actorUsername?: string
  ) => {
    const { createHospital } = await import('../services/hospital-service');
    const hospital = await createHospital(data, actorId, actorUsername);
    await loadHospitals();
    return hospital;
  }, [loadHospitals]);

  return { hospitals, loading, error, create, reload: loadHospitals };
}
