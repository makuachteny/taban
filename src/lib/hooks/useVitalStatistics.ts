'use client';

import { useState, useEffect, useCallback } from 'react';

interface VitalStats {
  birthStats: Awaited<ReturnType<typeof import('../services/birth-service').getBirthStats>>;
  deathStats: Awaited<ReturnType<typeof import('../services/death-service').getDeathStats>>;
}

export function useVitalStatistics() {
  const [data, setData] = useState<VitalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getBirthStats } = await import('../services/birth-service');
      const { getDeathStats } = await import('../services/death-service');
      const [birthStats, deathStats] = await Promise.all([getBirthStats(), getDeathStats()]);
      setData({ birthStats, deathStats });
    } catch (err) {
      console.error('Failed to load vital statistics', err);
      setError('Failed to load vital statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
