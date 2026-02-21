'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ANCVisitDoc } from '../db-types';

export function useANC() {
  const [visits, setVisits] = useState<ANCVisitDoc[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof import('../services/anc-service').getANCStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getAllANCVisits, getANCStats } = await import('../services/anc-service');
      const [data, s] = await Promise.all([getAllANCVisits(), getANCStats()]);
      setVisits(data);
      setStats(s);
    } catch (err) {
      console.error('Failed to load ANC visits', err);
      setError('Failed to load ANC visits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const register = useCallback(async (data: Omit<ANCVisitDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createANCVisit } = await import('../services/anc-service');
    const doc = await createANCVisit(data);
    await load();
    return doc;
  }, [load]);

  return { visits, stats, loading, error, register, reload: load };
}
