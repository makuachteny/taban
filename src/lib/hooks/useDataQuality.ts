'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NationalDataQuality } from '../services/data-quality-service';

export function useDataQuality() {
  const [data, setData] = useState<NationalDataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getNationalDataQuality } = await import('../services/data-quality-service');
      const result = await getNationalDataQuality();
      setData(result);
    } catch (err) {
      console.error('Failed to load data quality', err);
      setError('Failed to load data quality');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
