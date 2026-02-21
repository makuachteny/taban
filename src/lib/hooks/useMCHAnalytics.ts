'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MCHAnalyticsData } from '../services/mch-analytics-service';

export function useMCHAnalytics() {
  const [data, setData] = useState<MCHAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getMCHAnalytics } = await import('../services/mch-analytics-service');
      const result = await getMCHAnalytics();
      setData(result);
    } catch (err) {
      console.error('Failed to load MCH analytics', err);
      setError('Failed to load MCH analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
