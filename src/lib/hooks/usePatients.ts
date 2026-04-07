'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PatientDoc } from '../db-types';
import { useApp } from '../context';

export function usePatients() {
  const [patients, setPatients] = useState<PatientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useApp();
  const scope = useMemo(() => (
    currentUser ? { orgId: currentUser.orgId, hospitalId: currentUser.hospitalId, role: currentUser.role } : undefined
  ), [currentUser?.orgId, currentUser?.hospitalId, currentUser?.role]);

  const loadPatients = useCallback(async () => {
    try {
      const { getAllPatients } = await import('../services/patient-service');
      const data = await getAllPatients(scope);
      setPatients(data);
      setError(null);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadPatients();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPatients]);

  const search = useCallback(async (query: string) => {
    if (!query) {
      await loadPatients();
      return;
    }
    const { searchPatients } = await import('../services/patient-service');
    const results = await searchPatients(query, scope);
    setPatients(results);
  }, [loadPatients, scope]);

  const create = useCallback(async (data: Omit<PatientDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createPatient } = await import('../services/patient-service');
    const patient = await createPatient(data);
    await loadPatients();
    return patient;
  }, [loadPatients]);

  const update = useCallback(async (id: string, data: Partial<PatientDoc>) => {
    const { updatePatient } = await import('../services/patient-service');
    const patient = await updatePatient(id, data);
    await loadPatients();
    return patient;
  }, [loadPatients]);

  return { patients, loading, error, search, create, update, reload: loadPatients };
}
