'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiseaseAlertDoc } from '../db-types';
import { useApp } from '../context';

export function useSurveillance() {
  const [alerts, setAlerts] = useState<DiseaseAlertDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useApp();
  const scope = useMemo(() => (
    currentUser ? { orgId: currentUser.orgId, hospitalId: currentUser.hospitalId, role: currentUser.role } : undefined
  ), [currentUser?.orgId, currentUser?.hospitalId, currentUser?.role]);

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const { getAllAlerts } = await import('../services/surveillance-service');
      const data = await getAllAlerts(scope);
      setAlerts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load surveillance alerts');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return { alerts, loading, error, reload: loadAlerts };
}
