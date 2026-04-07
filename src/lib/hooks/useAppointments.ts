'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppointmentDoc, AppointmentStatus } from '../db-types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { getAllAppointments } = await import('../services/appointment-service');
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const create = useCallback(async (data: Omit<AppointmentDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const { createAppointment } = await import('../services/appointment-service');
    const appointment = await createAppointment(data);
    await load();
    return appointment;
  }, [load]);

  const updateStatus = useCallback(async (
    id: string,
    status: AppointmentStatus,
    extra?: { cancelledReason?: string; cancelledBy?: string }
  ) => {
    const { updateAppointmentStatus } = await import('../services/appointment-service');
    await updateAppointmentStatus(id, status, extra);
    await load();
  }, [load]);

  const reschedule = useCallback(async (id: string, newDate: string, newTime: string) => {
    const { rescheduleAppointment } = await import('../services/appointment-service');
    await rescheduleAppointment(id, newDate, newTime);
    await load();
  }, [load]);

  const update = useCallback(async (id: string, updates: Partial<AppointmentDoc>) => {
    const { updateAppointment } = await import('../services/appointment-service');
    await updateAppointment(id, updates);
    await load();
  }, [load]);

  return { appointments, loading, error, create, updateStatus, reschedule, update, reload: load };
}

export function usePatientAppointments(patientId?: string) {
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) { setAppointments([]); setLoading(false); return; }
    try {
      setError(null);
      const { getAppointmentsByPatient } = await import('../services/appointment-service');
      const data = await getAppointmentsByPatient(patientId);
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load patient appointments');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  return { appointments, loading, error, reload: load };
}

export function useAppointmentStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof import('../services/appointment-service').getAppointmentStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { getAppointmentStats } = await import('../services/appointment-service');
      const data = await getAppointmentStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { stats, loading, reload: load };
}
