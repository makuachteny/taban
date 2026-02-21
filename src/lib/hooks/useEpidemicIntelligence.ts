'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EpidemicIntelligenceData } from '../services/epidemic-intelligence-service';

export function useEpidemicIntelligence() {
  const [data, setData] = useState<EpidemicIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getEpidemicIntelligence } = await import('../services/epidemic-intelligence-service');
      const result = await getEpidemicIntelligence();
      setData(result);
    } catch (err) {
      console.error('Failed to load epidemic intelligence', err);
      setError('Failed to load epidemic intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
