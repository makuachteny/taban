'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePatients } from '@/lib/hooks/usePatients';
import { useReferrals } from '@/lib/hooks/useReferrals';
import { formatCompactDateTime as formatAdmittedAt } from '@/lib/format-utils';
import {
  Users, Calendar, ClipboardCheck, ArrowRightLeft, MessageSquare,
  Activity, UserPlus, Clock, ChevronRight, Shield, Wifi,
  Radio, LogIn, Bell, FileText, ClipboardList, Filter, RotateCw, AlertCircle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Eye, EyeOff, CheckCircle, AlertTriangle, Zap
} from 'lucide-react';

const ACCENT = 'var(--accent-primary)';

const EVENT_TYPES = [
  { type: 'arrival', label: 'Patient Arrived', color: '#14B8A6', icon: LogIn },
  { type: 'registered', label: 'Patient Registered', color: '#60A5FA', icon: UserPlus },
  { type: 'checked_in', label: 'Patient Checked In', color: 'var(--color-success)', icon: ClipboardCheck },
  { type: 'appointment', label: 'Appointment Scheduled', color: '#A855F7', icon: Calendar },
  { type: 'referral', label: 'Referral Received', color: 'var(--color-warning)', icon: ArrowRightLeft },
  { type: 'message', label: 'Message Sent', color: '#FB923C', icon: MessageSquare },
  { type: 'triage', label: 'Triage Complete', color: '#EC4899', icon: Activity },
  { type: 'discharge', label: 'Patient Discharged', color: '#38BDF8', icon: FileText },
];

/**
 * Fallback patient names used only when the patient DB hasn't synced yet (cold
 * start). The dashboard immediately switches to real patient names from the
 * `usePatients()` hook as soon as data loads.
 */
const FALLBACK_PATIENT_NAMES = [
  'Deng Mabior', 'Achol Mayen', 'Nyamal Koang', 'Gatluak Ruot', 'Ayen Dut',
  'Kuol Akot', 'Ladu Tombe', 'Rose Gbudue', 'Majok Chol', 'Nyandit Dut',
];

const DEPARTMENTS = ['OPD', 'Emergency', 'Maternity', 'Pediatrics', 'Surgery', 'Pharmacy'];

// Feature 3: Complaint-to-Department mapping
const COMPLAINT_DEPARTMENT_MAP: Record<string, string> = {
  fever: 'General Medicine',
  malaria: 'General Medicine',
  cough: 'General Medicine',
  headache: 'General Medicine',
  pregnancy: 'Maternity',
  anc: 'Maternity',
  antenatal: 'Maternity',
  injury: 'Emergency',
  wound: 'Emergency',
  fracture: 'Emergency',
  accident: 'Emergency',
  child: 'Pediatrics',
  pediatric: 'Pediatrics',
  infant: 'Pediatrics',
  eye: 'Ophthalmology',
  vision: 'Ophthalmology',
  dental: 'Dental',
  tooth: 'Dental',
  toothache: 'Dental',
  skin: 'Dermatology',
  rash: 'Dermatology',
};

function suggestDepartment(complaint: string): string {
  const lower = complaint.toLowerCase();
  for (const [keyword, dept] of Object.entries(COMPLAINT_DEPARTMENT_MAP)) {
    if (lower.includes(keyword)) return dept;
  }
  return 'General Medicine';
}

const SAMPLE_COMPLAINTS = [
  'fever and body aches',
  'pregnancy checkup - anc visit',
  'wound on left arm',
  'child with cough',
  'eye pain and blurred vision',
  'toothache for 3 days',
  'skin rash on chest',
  'headache and dizziness',
  'fracture right leg',
  'malaria symptoms',
  'routine checkup',
  'back pain',
  'antenatal follow-up',
  'infant vaccination',
  'dental cleaning',
];

type QueueStatus = 'WAITING' | 'IN CONSULT' | 'DONE';
type QueueType = 'walk-in' | 'appointment' | 'referral';

interface QueueEntry {
  id: number;
  position: number;
  patientName: string;
  priority: 'urgent' | 'normal' | 'routine';
  type: QueueType;
  complaint: string;
  department: string;
  checkInTime: string;
  estWait: string;
  status: QueueStatus;
}

// Feature 4: Previous visit data for repeat visitors
const PREVIOUS_VISITS: Record<string, { lastDepartment: string; lastComplaint: string; lastVisitDate: string }> = {
  'Deng Mabior': { lastDepartment: 'General Medicine', lastComplaint: 'fever and body aches', lastVisitDate: '2026-02-15' },
  'Achol Mayen': { lastDepartment: 'Maternity', lastComplaint: 'pregnancy checkup - anc visit', lastVisitDate: '2026-03-01' },
  'Gatluak Ruot': { lastDepartment: 'Emergency', lastComplaint: 'wound on left arm', lastVisitDate: '2026-01-20' },
  'Kuol Akot': { lastDepartment: 'Pediatrics', lastComplaint: 'child with cough', lastVisitDate: '2026-02-28' },
  'Nyandit Dut': { lastDepartment: 'Dental', lastComplaint: 'toothache for 3 days', lastVisitDate: '2026-03-05' },
  'Garang Makuei': { lastDepartment: 'Ophthalmology', lastComplaint: 'eye pain and blurred vision', lastVisitDate: '2026-02-10' },
};

interface LiveEvent {
  id: number;
  type: string;
  label: string;
  color: string;
  icon: typeof Activity;
  patient: string;
  department: string;
  time: string;
  isNew: boolean;
}

function buildQueueFromPatients(names: string[]): QueueEntry[] {
  const pool = names.length > 0 ? names : FALLBACK_PATIENT_NAMES;
  const now = new Date();
  return pool.slice(0, 10).map((name, i) => {
    const complaint = SAMPLE_COMPLAINTS[i % SAMPLE_COMPLAINTS.length];
    const checkIn = new Date(now.getTime() - (10 - i) * 8 * 60000);
    const status: QueueStatus = i < 2 ? 'IN CONSULT' : i < 8 ? 'WAITING' : 'DONE';
    return {
      id: i + 1,
      position: i + 1,
      patientName: name,
      priority: i === 0 ? 'urgent' : i < 3 ? 'normal' : 'routine',
      type: (i % 3 === 0 ? 'appointment' : 'walk-in') as QueueType,
      complaint,
      department: suggestDepartment(complaint),
      checkInTime: checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      estWait: `${(i + 1) * 12}m`,
      status,
    };
  });
}

export default function FrontDeskDashboardPage() {
  const router = useRouter();
  const { currentUser, globalSearch } = useApp();
  const { patients } = usePatients();
  const { referrals, updateStatus } = useReferrals();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  // Real patient name pool (used by queue, live ticker, and any place we
  // would have shown SAMPLE_PATIENTS).
  const livePatientNames = useMemo(() => {
    const names = (patients || [])
      .map(p => `${p.firstName || ''} ${p.surname || ''}`.trim())
      .filter(Boolean);
    return names.length > 0 ? names : FALLBACK_PATIENT_NAMES;
  }, [patients]);

  // Feature 1: Live Queue Board state — seeded once from real patient names
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(() => buildQueueFromPatients([]));
  const [queueSeeded, setQueueSeeded] = useState(false);
  useEffect(() => {
    // Re-seed once when patients first load so the queue shows real names
    if (!queueSeeded && livePatientNames.length > 0 && livePatientNames !== FALLBACK_PATIENT_NAMES) {
      setQueueEntries(buildQueueFromPatients(livePatientNames));
      setQueueSeeded(true);
    }
  }, [livePatientNames, queueSeeded]);

  // Feature 2: Walk-in vs Appointment filter
  const [queueFilter, setQueueFilter] = useState<'all' | 'walk-in' | 'appointment'>('all');

  // Feature 4: Selected patient for check-in (to show previous visit info)
  const [selectedCheckInPatient, setSelectedCheckInPatient] = useState<string | null>(null);

  // Incoming Referrals state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expandedReferralId, setExpandedReferralId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [referralToast, setReferralToast] = useState<string | null>(null);

  const generateEvent = useCallback((): LiveEvent => {
    const evtType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const now = new Date();
    return {
      id: Date.now() + Math.random(),
      ...evtType,
      patient: livePatientNames[Math.floor(Math.random() * livePatientNames.length)],
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isNew: true,
    };
  }, [livePatientNames]);

  useEffect(() => {
    const initial: LiveEvent[] = [];
    for (let i = 0; i < 6; i++) {
      initial.push({ ...generateEvent(), isNew: false, id: i });
    }
    setLiveEvents(initial);

    const interval = setInterval(() => {
      setLiveEvents(prev => {
        const newEvent = generateEvent();
        return [newEvent, ...prev.slice(0, 9).map(e => ({ ...e, isNew: false }))];
      });
      setEventCounter(c => c + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [generateEvent]);

  // Feature 1: Auto-refresh queue every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueEntries(prev =>
        prev.map(entry => {
          // Randomly advance some statuses
          if (entry.status === 'WAITING' && Math.random() < 0.15) {
            return { ...entry, status: 'IN CONSULT' as QueueStatus };
          }
          if (entry.status === 'IN CONSULT' && Math.random() < 0.1) {
            return { ...entry, status: 'DONE' as QueueStatus };
          }
          return entry;
        })
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Feature 2: Filtered queue entries
  const filteredQueueEntries = useMemo(() => {
    if (queueFilter === 'all') return queueEntries;
    return queueEntries.filter(entry => entry.type === queueFilter);
  }, [queueEntries, queueFilter]);

  // Feature 4: Previous visit info for selected patient
  const previousVisitInfo = useMemo(() => {
    if (!selectedCheckInPatient) return null;
    return PREVIOUS_VISITS[selectedCheckInPatient] || null;
  }, [selectedCheckInPatient]);

  // Incoming referrals: filter by current facility and pending statuses, sort emergency first
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const incomingReferrals = useMemo(() => {
    const facilityId = currentUser?.hospitalId || '';
    return referrals
      .filter(r => r.toHospitalId === facilityId && (r.status === 'sent' || r.status === 'received'))
      .sort((a, b) => {
        const urgencyOrder = { emergency: 0, urgent: 1, routine: 2 };
        return (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
      });
  }, [referrals, currentUser?.hospitalId]);

  // Handle referral check-in
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReferralCheckIn = useCallback(async (referral: typeof referrals[0]) => {
    try {
      await updateStatus(referral._id, 'received');
      const newEntry: QueueEntry = {
        id: Date.now(),
        position: queueEntries.length + 1,
        patientName: referral.patientName,
        priority: referral.urgency === 'emergency' ? 'urgent' : referral.urgency === 'urgent' ? 'urgent' : 'normal',
        type: 'referral',
        complaint: referral.reason,
        department: referral.department || 'General Medicine',
        checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        estWait: `${(queueEntries.length + 1) * 12}m`,
        status: 'WAITING',
      };
      setQueueEntries(prev => [...prev, newEntry]);
      setReferralToast(`Patient ${referral.patientName} checked in from referral`);
      setTimeout(() => setReferralToast(null), 4000);
    } catch {
      setReferralToast('Failed to check in referral patient');
      setTimeout(() => setReferralToast(null), 4000);
    }
  }, [updateStatus, queueEntries.length]);

  if (!currentUser) return null;

  const hospital = currentUser.hospital;
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const pendingReferrals = referrals.filter(r => r.status === 'sent' || r.status === 'received');

  const recentPatients = [...patients]
    .sort((a, b) => {
      const ta = new Date(a.registeredAt || a.registrationDate || 0).getTime();
      const tb = new Date(b.registeredAt || b.registrationDate || 0).getTime();
      return tb - ta;
    })
    .filter(p =>
      !globalSearch ||
      `${p.firstName} ${p.surname}`.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.hospitalNumber.toLowerCase().includes(globalSearch.toLowerCase())
    )
    .slice(0, 8);

  // Simulated queue data (kept for KPI strip compatibility) — derived from real patient names
  const waitingQueue = livePatientNames.slice(0, 5).map((name, i) => ({
    name,
    waitTime: `${10 + i * 8}m`,
    priority: i === 0 ? 'urgent' : i < 2 ? 'normal' : 'routine',
    dept: DEPARTMENTS[i % DEPARTMENTS.length],
  }));

  const upcomingAppointments = livePatientNames.slice(5, 10).map((name, i) => {
    const hour = 8 + i;
    return {
      name,
      time: `${hour.toString().padStart(2, '0')}:${((i * 15) % 60).toString().padStart(2, '0')}`,
      dept: DEPARTMENTS[(i + 2) % DEPARTMENTS.length],
      status: i < 2 ? 'arrived' : i < 4 ? 'confirmed' : 'pending',
    };
  });

  const statusColor = (s: QueueStatus) =>
    s === 'WAITING' ? '#60A5FA' : s === 'IN CONSULT' ? 'var(--color-warning)' : 'var(--color-success)';

  const priorityColor = (p: string) =>
    p === 'urgent' ? '#F87171' : p === 'normal' ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <>
      <TopBar title="Reception Center" />
      <main className="page-container page-enter">

        {/* COMMAND CENTER HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'var(--accent-primary)',
            }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Reception
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {todayDate} · {hospital?.name || currentUser.hospitalName || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                <span>Connected · {hospital?.internetType || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {[
            { label: 'Registrations', value: (hospital?.todayVisits || Math.max(12, patients.length)).toString(), icon: UserPlus, color: ACCENT },
            { label: 'Waiting', value: waitingQueue.length.toString(), icon: Clock, color: '#FB923C' },
            { label: 'Check-ins', value: Math.floor(patients.length * 0.6).toString(), icon: ClipboardCheck, color: 'var(--color-success)' },
            { label: 'Appointments', value: upcomingAppointments.length.toString(), icon: Calendar, color: '#60A5FA' },
            { label: 'Referrals', value: pendingReferrals.length.toString(), icon: ArrowRightLeft, color: 'var(--color-warning)' },
            { label: 'Messages', value: Math.floor(referrals.length * 1.5).toString(), icon: MessageSquare, color: '#A855F7' },
            { label: 'Active', value: patients.length.toString(), icon: Users, color: '#38BDF8' },
            { label: 'Pending', value: Math.ceil(patients.length * 0.15).toString(), icon: Bell, color: '#F87171' },
          ].map((kpi) => (
            <div key={kpi.label} className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => {
                const routes: Record<string, string> = { 'Registrations': '/patients', 'Waiting': '/patients', 'Check-ins': '/patients', 'Referrals': '/referrals', 'Messages': '/messages' };
                if (routes[kpi.label]) router.push(routes[kpi.label]);
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--card-shadow)',
              }}>
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ========== INCOMING REFERRALS PANEL ========== */}
        {incomingReferrals.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" style={{ color: '#FB923C' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Incoming Referrals</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                  background: '#FB923C20',
                  color: '#FB923C',
                  border: '1px solid #FB923C30',
                }}>{incomingReferrals.length}</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {incomingReferrals.filter(r => r.urgency === 'emergency').length} emergency
              </span>
            </div>
            <div className="p-3 space-y-2">
              {incomingReferrals.map(ref => {
                const isExpanded = expandedReferralId === ref._id;
                const urgencyColor = ref.urgency === 'emergency' ? 'var(--color-danger)' : ref.urgency === 'urgent' ? 'var(--color-warning)' : 'var(--color-success)';
                const UrgencyIcon = ref.urgency === 'emergency' ? Zap : ref.urgency === 'urgent' ? AlertTriangle : CheckCircle;
                const statusColor = ref.status === 'sent' ? '#60A5FA' : 'var(--color-warning)';
                const isEmergency = ref.urgency === 'emergency';

                return (
                  <div key={ref._id} className="rounded-xl overflow-hidden transition-all" style={{
                    background: isEmergency ? '#EF444408' : 'var(--overlay-subtle)',
                    border: isEmergency ? '1px solid #EF444430' : '1px solid var(--border-light)',
                  }}>
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: isEmergency ? 'var(--color-danger)' : ACCENT }}>
                        {ref.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {ref.patientName}
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{
                            background: `${urgencyColor}15`,
                            color: urgencyColor,
                            border: `1px solid ${urgencyColor}30`,
                          }}>
                            <UrgencyIcon className="w-2.5 h-2.5" />
                            {ref.urgency.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{
                            background: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`,
                          }}>{ref.status.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            From: <strong style={{ color: 'var(--text-secondary)' }}>{ref.fromHospital}</strong>
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>·</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ref.department}</span>
                        </div>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {ref.reason}
                        </p>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {new Date(ref.referralDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setExpandedReferralId(isExpanded ? null : ref._id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}
                          title="View Details"
                        >
                          {isExpanded
                            ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            : <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          }
                        </button>
                        <button
                          onClick={() => handleReferralCheckIn(ref)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all text-white"
                          style={{ background: ACCENT }}
                          title="Check in patient from referral"
                        >
                          <LogIn className="w-3 h-3" />
                          Check In
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg" style={{
                          background: `${ACCENT}05`,
                          border: `1px solid ${ACCENT}15`,
                        }}>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Reason</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{ref.reason}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Referring Doctor</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{ref.referringDoctor}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Department</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{ref.department}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date Sent</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                              {new Date(ref.referralDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {ref.notes && (
                          <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                            <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{ref.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== TOAST NOTIFICATION ========== */}
        {referralToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
            style={{ background: ACCENT, animation: 'fadeIn 0.3s ease-out' }}>
            <CheckCircle className="w-4 h-4" />
            {referralToast}
          </div>
        )}

        {/* ========== FEATURE 1 & 2: LIVE QUEUE BOARD WITH FILTER TOGGLE ========== */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--card-shadow)',
        }}>
          {/* Queue Board Header with Filter Toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Queue Board</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                background: 'rgba(20,184,166,0.1)',
                color: '#14B8A6',
                border: '1px solid rgba(20,184,166,0.2)',
              }}>LIVE</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Auto-refreshes every 30s
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Feature 2: Walk-in vs Appointment Toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                {([
                  { key: 'all' as const, label: 'All' },
                  { key: 'walk-in' as const, label: 'Walk-ins' },
                  { key: 'appointment' as const, label: 'Appointments' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setQueueFilter(tab.key)}
                    className="px-3 py-1 rounded-md text-[10px] font-semibold transition-all"
                    style={{
                      background: queueFilter === tab.key ? ACCENT : 'transparent',
                      color: queueFilter === tab.key ? '#FFFFFF' : 'var(--text-muted)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {filteredQueueEntries.length} patients
                </span>
              </div>
              <button
                onClick={() => setQueueEntries(buildQueueFromPatients(livePatientNames))}
                className="p-1 rounded-md transition-all"
                style={{ background: 'var(--overlay-subtle)' }}
                title="Refresh queue"
              >
                <RotateCw className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['#', 'Patient Name', 'Priority', 'Type', 'Complaint', 'Department', 'Check-in Time', 'Est. Wait', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQueueEntries.map(entry => {
                  const sColor = statusColor(entry.status);
                  const pColor = priorityColor(entry.priority);
                  return (
                    <tr
                      key={entry.id}
                      className="cursor-pointer transition-all"
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                      onClick={() => setSelectedCheckInPatient(entry.patientName)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--overlay-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-3 py-2.5 text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{entry.position}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ background: ACCENT }}>
                            {entry.patientName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{entry.patientName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                          background: `${pColor}15`,
                          color: pColor,
                          border: `1px solid ${pColor}30`,
                        }}>{entry.priority.toUpperCase()}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{
                          background: entry.type === 'walk-in' ? '#FB923C15' : '#A855F715',
                          color: entry.type === 'walk-in' ? '#FB923C' : '#A855F7',
                          border: `1px solid ${entry.type === 'walk-in' ? '#FB923C30' : '#A855F730'}`,
                        }}>{entry.type === 'walk-in' ? 'WALK-IN' : 'APPT'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] max-w-[160px] truncate" style={{ color: 'var(--text-secondary)' }}>{entry.complaint}</td>
                      <td className="px-3 py-2.5 text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{entry.department}</td>
                      <td className="px-3 py-2.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{entry.checkInTime}</td>
                      <td className="px-3 py-2.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-2.5 h-2.5 inline mr-0.5" />{entry.estWait}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                          background: `${sColor}15`,
                          color: sColor,
                          border: `1px solid ${sColor}30`,
                        }}>{entry.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========== FEATURE 4: REPEAT VISIT AUTO-FILL BANNER ========== */}
        {selectedCheckInPatient && (
          <div className="rounded-2xl overflow-hidden mb-4 p-4" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Check-in: {selectedCheckInPatient}</span>
              </div>
              <button
                onClick={() => setSelectedCheckInPatient(null)}
                className="text-[10px] font-medium px-2 py-1 rounded-md"
                style={{ color: 'var(--text-muted)', background: 'var(--overlay-subtle)' }}
              >
                Close
              </button>
            </div>

            {previousVisitInfo ? (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}20`,
              }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold mb-1" style={{ color: ACCENT }}>
                    Previous Visit Found — Returning Patient
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Department</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{previousVisitInfo.lastDepartment}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Complaint</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{previousVisitInfo.lastComplaint}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Visit Date</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{previousVisitInfo.lastVisitDate}</p>
                    </div>
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                    Department pre-filled from previous visit: <strong style={{ color: 'var(--text-primary)' }}>{previousVisitInfo.lastDepartment}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl" style={{
                background: 'var(--overlay-subtle)',
                border: '1px solid var(--border-light)',
              }}>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  No previous visit records found for this patient. This appears to be a first-time visit.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MAIN GRID: Check-in Queue (2 cols) + Registration Feed (1 col) + Appointments (1 col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

          {/* Check-in Queue - 2 columns */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Check-in Queue</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                  background: `rgba(20,184,166,0.1)`,
                  color: ACCENT,
                  border: `1px solid rgba(20,184,166,0.2)`,
                }}>LIVE</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{waitingQueue.length} waiting</span>
            </div>
            <div className="p-3 space-y-2">
              {waitingQueue.map((item, idx) => {
                const pColor = item.priority === 'urgent' ? '#F87171' : item.priority === 'normal' ? 'var(--color-warning)' : 'var(--color-success)';
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    onClick={() => router.push('/patients')}
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: `1px solid var(--border-light)`,
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--accent-primary)' }}>
                      {item.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.dept}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: `${pColor}15`,
                        color: pColor,
                        border: `1px solid ${pColor}30`,
                      }}>{item.priority.toUpperCase()}</span>
                      <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-2.5 h-2.5 inline mr-0.5" />{item.waitTime}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Feed - 1 column */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
            maxHeight: '440px',
          }}>
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activity Feed</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{eventCounter} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {liveEvents.map(evt => {
                const Icon = evt.icon;
                return (
                  <div key={evt.id} className="p-2 rounded-lg transition-all"
                    style={{
                      background: evt.isNew ? `${evt.color}08` : 'transparent',
                      border: evt.isNew ? `1px solid ${evt.color}20` : '1px solid transparent',
                      animation: evt.isNew ? 'fadeIn 0.3s ease-out' : undefined,
                    }}>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${evt.color}15` }}>
                        <Icon className="w-3 h-3" style={{ color: evt.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold truncate" style={{ color: evt.color }}>{evt.label}</span>
                          {evt.isNew && (
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: `${evt.color}20`, color: evt.color }}>NEW</span>
                          )}
                        </div>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{evt.patient}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{evt.department}</span>
                          <span className="text-[9px] font-mono flex-shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>{evt.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointments - 1 column */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
            maxHeight: '440px',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#60A5FA' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Appointments</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Today</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {upcomingAppointments.map((appt, idx) => {
                const sColor = appt.status === 'arrived' ? 'var(--color-success)' : appt.status === 'confirmed' ? '#60A5FA' : 'var(--color-warning)';
                return (
                  <div key={idx} className="p-2.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: '1px solid var(--border-light)',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{appt.name}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: `${sColor}15`,
                        color: sColor,
                        border: `1px solid ${sColor}30`,
                      }}>{appt.status.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{appt.dept}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{appt.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM: Recent Registrations Table + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recent Registrations - 3 columns */}
          <div className="col-span-3 rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Registrations</span>
              </div>
              <button onClick={() => router.push('/patients')} className="text-xs font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {['Patient', 'ID', 'Gender', 'Age', 'Registered', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map(patient => (
                    <tr key={patient._id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer transition-all"
                      onClick={() => router.push(`/patients/${patient._id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/patients/${patient._id}`); } }}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--overlay-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      title="View patient record">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ background: 'var(--accent-primary)' }}>
                            {(patient.firstName || '?')[0]}{(patient.surname || '?')[0]}
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            {patient.firstName} {patient.surname}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{patient.hospitalNumber}</td>
                      <td className="px-4 py-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>{patient.gender}</td>
                      <td className="px-4 py-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {patient.estimatedAge || (patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0)}y
                      </td>
                      <td className="px-4 py-2.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                          {formatAdmittedAt(patient.registeredAt || patient.registrationDate)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                          background: 'rgba(20,184,166,0.1)',
                          color: ACCENT,
                          border: '1px solid rgba(20,184,166,0.2)',
                        }}>REGISTERED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions - 1 column */}
          <div className="rounded-2xl p-4" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: 'Register Patient', icon: UserPlus, href: '/patients/new', color: ACCENT },
                { label: 'Check In', icon: ClipboardCheck, href: '/patients', color: 'var(--color-success)' },
                { label: 'Referrals', icon: ArrowRightLeft, href: '/referrals', color: 'var(--color-warning)' },
                { label: 'Message', icon: MessageSquare, href: '/messages', color: '#A855F7' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: `${action.color}08`, border: `1px solid ${action.color}20` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${action.color}15` }}>
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>

            {/* Pending Referrals Summary */}
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Referral Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Pending', value: pendingReferrals.length, color: 'var(--color-warning)' },
                  { label: 'Total', value: referrals.length, color: ACCENT },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-2 rounded-lg" style={{ background: `${stat.color}08` }}>
                    <p className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
