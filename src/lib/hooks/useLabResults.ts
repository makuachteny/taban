'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LabResultDoc } from '../db-types';

export function useLabResults() {
  const [results, setResults] = useState<LabResultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    try {
      setError(null);
      const { getAllLabResults } = await import('../services/lab-service');
      const data = await getAllLabResults();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load lab results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const create = useCallback(async (data: Omit<LabResultDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createLabResult } = await import('../services/lab-service');
    const result = await createLabResult(data);
    await loadResults();
    return result;
  }, [loadResults]);

  const update = useCallback(async (id: string, data: Partial<LabResultDoc>) => {
    const { updateLabResult } = await import('../services/lab-service');
    const result = await updateLabResult(id, data);
    await loadResults();
    return result;
  }, [loadResults]);

  return { results, loading, error, create, update, reload: loadResults };
}
