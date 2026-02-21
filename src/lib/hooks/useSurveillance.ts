'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DiseaseAlertDoc } from '../db-types';

export function useSurveillance() {
  const [alerts, setAlerts] = useState<DiseaseAlertDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const { getAllAlerts } = await import('../services/surveillance-service');
      const data = await getAllAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load surveillance alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return { alerts, loading, error, reload: loadAlerts };
}
