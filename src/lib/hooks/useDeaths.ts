'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeathRegistrationDoc } from '../db-types';

export function useDeaths() {
  const [deaths, setDeaths] = useState<DeathRegistrationDoc[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof import('../services/death-service').getDeathStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getAllDeaths, getDeathStats } = await import('../services/death-service');
      const [data, s] = await Promise.all([getAllDeaths(), getDeathStats()]);
      setDeaths(data);
      setStats(s);
    } catch (err) {
      console.error('Failed to load deaths', err);
      setError('Failed to load deaths');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const register = useCallback(async (data: Omit<DeathRegistrationDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createDeath } = await import('../services/death-service');
    const doc = await createDeath(data);
    await load();
    return doc;
  }, [load]);

  return { deaths, stats, loading, error, register, reload: load };
}
