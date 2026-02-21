'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ImmunizationDoc } from '../db-types';

export function useImmunizations() {
  const [immunizations, setImmunizations] = useState<ImmunizationDoc[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof import('../services/immunization-service').getImmunizationStats>> | null>(null);
  const [coverage, setCoverage] = useState<Awaited<ReturnType<typeof import('../services/immunization-service').getVaccineCoverage>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getAllImmunizations, getImmunizationStats, getVaccineCoverage } = await import('../services/immunization-service');
      const [data, s, c] = await Promise.all([getAllImmunizations(), getImmunizationStats(), getVaccineCoverage()]);
      setImmunizations(data);
      setStats(s);
      setCoverage(c);
    } catch (err) {
      console.error('Failed to load immunizations', err);
      setError('Failed to load immunizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const register = useCallback(async (data: Omit<ImmunizationDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createImmunization } = await import('../services/immunization-service');
    const doc = await createImmunization(data);
    await load();
    return doc;
  }, [load]);

  return { immunizations, stats, coverage, loading, error, register, reload: load };
}
