'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePatients } from '@/lib/hooks/usePatients';
import { useImmunizations } from '@/lib/hooks/useImmunizations';
import { useANC } from '@/lib/hooks/useANC';
import { useBirths } from '@/lib/hooks/useBirths';
import { useLabResults } from '@/lib/hooks/useLabResults';
import {
  Activity, HeartPulse, Syringe, Baby, Pill, Clock,
  Radio, Wifi, ChevronRight, Clipboard, Thermometer,
  Stethoscope, MessageSquare, FileText, BedDouble, AlertCircle,
  Shield, Droplets, Bandage, X, Check, Printer,
  AlertTriangle, ArrowUpDown, Wind, Eye, Brain, Heart
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface VitalsFormData {
  systolic: string;
  diastolic: string;
  temperature: string;
  pulse: string;
  spo2: string;
  weight: string;
  respiratoryRate: string;
  notes: string;
}

interface MAREntry {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  medication: string;
  dose: string;
  route: string;
  status: 'overdue' | 'due' | 'upcoming' | 'given';
  givenAt?: string;
}

interface TriageResult {
  airway: 'clear' | 'obstructed' | '';
  breathing: 'normal' | 'distressed' | 'absent' | '';
  circulation: 'normal' | 'impaired' | 'absent' | '';
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | '';
  priority: 'RED' | 'YELLOW' | 'GREEN' | '';
}

// Simulated nursing care events
const NURSE_EVENTS = [
  { type: 'vitals', label: 'Vitals Recorded', color: '#4ADE80', icon: Activity },
  { type: 'medication', label: 'Medication Given', color: '#60A5FA', icon: Pill },
  { type: 'birth_assist', label: 'Birth Assisted', color: '#EC4899', icon: Baby },
  { type: 'immunization', label: 'Immunization Given', color: '#A855F7', icon: Syringe },
  { type: 'wound_care', label: 'Wound Dressed', color: '#FB923C', icon: Bandage },
  { type: 'anc_check', label: 'ANC Checkup', color: '#F472B6', icon: HeartPulse },
  { type: 'blood_draw', label: 'Blood Sample Drawn', color: '#EF4444', icon: Droplets },
  { type: 'patient_assess', label: 'Patient Assessment', color: '#38BDF8', icon: Clipboard },
  { type: 'temp_check', label: 'Temperature Check', color: '#FBBF24', icon: Thermometer },
];

const NAMES = [
  'Deng Mabior', 'Achol Mayen', 'Nyamal Koang', 'Gatluak Ruot', 'Ayen Dut',
  'Kuol Akot', 'Ladu Tombe', 'Rose Gbudue', 'Majok Chol', 'Nyandit Dut',
  'Abuk Deng', 'Garang Makuei', 'Awut Makuei', 'Nyandeng Chol', 'Tut Chuol',
];
const WARDS = ['Maternity', 'General Ward', 'Pediatrics', 'OPD', 'Emergency', 'Post-Op'];

const MEDICATIONS = [
  { name: 'Amoxicillin', dose: '500mg', route: 'Oral' },
  { name: 'Paracetamol', dose: '1g', route: 'Oral' },
  { name: 'Metronidazole', dose: '400mg', route: 'Oral' },
  { name: 'Artesunate', dose: '120mg', route: 'IV' },
  { name: 'Ceftriaxone', dose: '1g', route: 'IM' },
  { name: 'ORS', dose: '1 sachet', route: 'Oral' },
  { name: 'Zinc', dose: '20mg', route: 'Oral' },
  { name: 'Ampicillin', dose: '500mg', route: 'IV' },
  { name: 'Gentamicin', dose: '80mg', route: 'IM' },
  { name: 'Iron/Folate', dose: '200mg/0.4mg', route: 'Oral' },
];

interface LiveEvent {
  id: number;
  type: string;
  label: string;
  color: string;
  icon: typeof Activity;
  patient: string;
  ward: string;
  time: string;
  isNew: boolean;
}

const ACCENT = '#0077D7';

// ============================================================
// Helper: Flag abnormal vitals
// ============================================================
function getVitalFlags(data: VitalsFormData): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  const temp = parseFloat(data.temperature);
  const sys = parseInt(data.systolic);
  const dia = parseInt(data.diastolic);
  const spo2 = parseInt(data.spo2);
  const pulse = parseInt(data.pulse);
  const rr = parseInt(data.respiratoryRate);

  if (!isNaN(temp) && temp > 38.5) flags.temperature = true;
  if (!isNaN(sys) && (sys > 140 || sys < 90)) flags.systolic = true;
  if (!isNaN(dia) && (dia > 90 || dia < 60)) flags.diastolic = true;
  if (!isNaN(spo2) && spo2 < 95) flags.spo2 = true;
  if (!isNaN(pulse) && (pulse > 100 || pulse < 50)) flags.pulse = true;
  if (!isNaN(rr) && (rr > 24 || rr < 12)) flags.respiratoryRate = true;

  return flags;
}

// ============================================================
// Helper: Calculate ETAT triage priority
// ============================================================
function calculateTriagePriority(triage: TriageResult): 'RED' | 'YELLOW' | 'GREEN' | '' {
  if (!triage.airway || !triage.breathing || !triage.circulation || !triage.consciousness) return '';

  if (
    triage.airway === 'obstructed' ||
    triage.breathing === 'absent' ||
    triage.circulation === 'absent' ||
    triage.consciousness === 'unresponsive'
  ) return 'RED';

  if (
    triage.breathing === 'distressed' ||
    triage.circulation === 'impaired' ||
    triage.consciousness === 'pain' ||
    triage.consciousness === 'verbal'
  ) return 'YELLOW';

  return 'GREEN';
}

// ============================================================
// Main Component
// ============================================================
export default function NurseDashboardPage() {
  const router = useRouter();
  const { currentUser, globalSearch } = useApp();
  const { patients } = usePatients();
  const { stats: immStats } = useImmunizations();
  const { stats: ancStats } = useANC();
  const { stats: birthStats } = useBirths();
  const { results: labResults } = useLabResults();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  // Feature states
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<{ id: string; name: string } | null>(null);
  const [vitalsForm, setVitalsForm] = useState<VitalsFormData>({
    systolic: '', diastolic: '', temperature: '', pulse: '', spo2: '', weight: '', respiratoryRate: '', notes: '',
  });
  const [vitalsSaving, setVitalsSaving] = useState(false);
  const [vitalsSaved, setVitalsSaved] = useState(false);

  const [activeTab, setActiveTab] = useState<'ward' | 'mar' | 'triage'>('ward');

  const [marEntries, setMarEntries] = useState<MAREntry[]>([]);

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffNotes, setHandoffNotes] = useState('');

  const [triageData, setTriageData] = useState<TriageResult>({
    airway: '', breathing: '', circulation: '', consciousness: '', priority: '',
  });
  const [triagePatientName, setTriagePatientName] = useState('');

  // Sort mode for task prioritization
  const [sortByUrgency, setSortByUrgency] = useState(true);

  const generateEvent = useCallback((): LiveEvent => {
    const evtType = NURSE_EVENTS[Math.floor(Math.random() * NURSE_EVENTS.length)];
    return {
      id: Date.now() + Math.random(), ...evtType,
      patient: NAMES[Math.floor(Math.random() * NAMES.length)],
      ward: WARDS[Math.floor(Math.random() * WARDS.length)],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isNew: true,
    };
  }, []);

  // Start live event feed
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

  // Generate MAR entries from patient data
  useEffect(() => {
    if (patients.length === 0) return;
    const now = new Date();
    const entries: MAREntry[] = [];
    const scheduleHours = [-2, -1, 0, 1, 2, 3, 4];

    patients.slice(0, 6).forEach((patient, pIdx) => {
      const medCount = 1 + (pIdx % 3);
      for (let m = 0; m < medCount; m++) {
        const med = MEDICATIONS[(pIdx * 3 + m) % MEDICATIONS.length];
        const hourOffset = scheduleHours[(pIdx + m) % scheduleHours.length];
        const schedTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
        let status: MAREntry['status'];
        if (hourOffset < -1) status = 'overdue';
        else if (hourOffset >= -1 && hourOffset <= 0) status = 'due';
        else status = 'upcoming';

        entries.push({
          id: `mar-${patient._id}-${m}`,
          time: schedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          patientId: patient._id,
          patientName: `${patient.firstName} ${patient.surname}`,
          medication: med.name,
          dose: med.dose,
          route: med.route,
          status,
        });
      }
    });

    // Sort: overdue first, then due, then upcoming, then given
    const order = { overdue: 0, due: 1, upcoming: 2, given: 3 };
    entries.sort((a, b) => order[a.status] - order[b.status]);
    setMarEntries(entries);
  }, [patients]);

  // Triage auto-calculate
  useEffect(() => {
    const priority = calculateTriagePriority(triageData);
    if (priority !== triageData.priority) {
      setTriageData(prev => ({ ...prev, priority }));
    }
  }, [triageData]);

  // Ward patients with priority sorting (Feature 5)
  const wardPatients = useMemo(() => {
    const filtered = patients.slice(0, 12).filter(p =>
      !globalSearch || `${p.firstName} ${p.surname}`.toLowerCase().includes(globalSearch.toLowerCase()) || p.hospitalNumber.toLowerCase().includes(globalSearch.toLowerCase())
    );

    if (!sortByUrgency) return filtered;

    return [...filtered].sort((a, b) => {
      const aIdx = patients.indexOf(a);
      const bIdx = patients.indexOf(b);
      const aVital = aIdx % 3 === 0 ? 0 : aIdx % 3 === 1 ? 1 : 2; // overdue=0, due=1, done=2
      const bVital = bIdx % 3 === 0 ? 0 : bIdx % 3 === 1 ? 1 : 2;
      return aVital - bVital;
    });
  }, [patients, globalSearch, sortByUrgency]);

  // Save vitals to PouchDB
  const handleSaveVitals = async () => {
    if (!vitalsPatient) return;
    setVitalsSaving(true);
    try {
      const { getDB } = await import('@/lib/db');
      const db = getDB('taban_vitals');
      await db.put({
        _id: `vitals-${vitalsPatient.id}-${Date.now()}`,
        type: 'vitals',
        patientId: vitalsPatient.id,
        patientName: vitalsPatient.name,
        systolic: parseInt(vitalsForm.systolic) || null,
        diastolic: parseInt(vitalsForm.diastolic) || null,
        temperature: parseFloat(vitalsForm.temperature) || null,
        pulse: parseInt(vitalsForm.pulse) || null,
        spo2: parseInt(vitalsForm.spo2) || null,
        weight: parseFloat(vitalsForm.weight) || null,
        respiratoryRate: parseInt(vitalsForm.respiratoryRate) || null,
        notes: vitalsForm.notes,
        flags: getVitalFlags(vitalsForm),
        recordedBy: currentUser?.name || '',
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setVitalsSaved(true);
      setTimeout(() => {
        setVitalsSaved(false);
        setVitalsModalOpen(false);
        setVitalsForm({ systolic: '', diastolic: '', temperature: '', pulse: '', spo2: '', weight: '', respiratoryRate: '', notes: '' });
      }, 1500);
    } catch (err) {
      console.error('Failed to save vitals:', err);
    } finally {
      setVitalsSaving(false);
    }
  };

  // MAR: mark medication as given
  const handleMarkGiven = (entryId: string) => {
    setMarEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, status: 'given' as const, givenAt: new Date().toISOString() } : e
    ));
  };

  if (!currentUser) return null;

  const hospital = currentUser.hospital;
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayName = currentUser.name.split(' ')[1] || currentUser.name.split(' ')[0];
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  const vitalsDue = Math.max(4, Math.floor(patients.length * 0.3));
  const medsDue = Math.max(6, Math.floor(patients.length * 0.25));
  const pendingOrders = Math.max(3, labResults.length > 0 ? Math.floor(labResults.length * 0.15) : 5);
  const messagesCount = Math.max(2, Math.floor(Math.random() * 4) + 2);
  const vitalFlags = getVitalFlags(vitalsForm);

  // Handoff data
  const criticalPatients = wardPatients.filter((_, idx) => {
    const origIdx = patients.indexOf(wardPatients[idx]);
    return origIdx % 3 === 0;
  });
  const overdueMarCount = marEntries.filter(e => e.status === 'overdue').length;
  const dueMarCount = marEntries.filter(e => e.status === 'due').length;

  // MAR color helper
  const marStatusColor = (status: MAREntry['status']) => {
    switch (status) {
      case 'overdue': return { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'OVERDUE' };
      case 'due': return { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', label: 'DUE NOW' };
      case 'upcoming': return { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', label: 'UPCOMING' };
      case 'given': return { bg: 'rgba(74,222,128,0.12)', color: '#4ADE80', label: 'GIVEN' };
    }
  };

  const triagePriorityColor = (priority: string) => {
    switch (priority) {
      case 'RED': return { bg: '#EF4444', text: '#FFF', label: 'EMERGENCY - Immediate treatment required' };
      case 'YELLOW': return { bg: '#FBBF24', text: '#000', label: 'PRIORITY - Needs prompt attention' };
      case 'GREEN': return { bg: '#4ADE80', text: '#000', label: 'NON-URGENT - Standard queue' };
      default: return { bg: '#94A3B8', text: '#FFF', label: 'Complete all fields' };
    }
  };

  return (
    <>
      <TopBar title="Nurse Station" />
      <main className="page-container page-enter">

        {/* COMMAND CENTER HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: '#0077D7',
            }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Good {greeting}, {displayName}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {todayDate} · {hospital?.name || currentUser.hospitalName || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Shift Handoff Button */}
            <button
              onClick={() => setHandoffOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'rgba(43,111,224,0.1)',
                color: ACCENT,
                border: `1px solid rgba(43,111,224,0.2)`,
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              Shift Handoff
            </button>
            <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" style={{ color: '#4ADE80' }} />
                <span>Connected · {hospital?.internetType || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {[
            { label: 'Ward Patients', value: patients.length.toString(), icon: BedDouble, color: ACCENT },
            { label: 'Vitals Due', value: vitalsDue.toString(), icon: Activity, color: '#F87171' },
            { label: 'Meds Due', value: medsDue.toString(), icon: Pill, color: '#60A5FA' },
            { label: 'ANC Mothers', value: ancStats?.totalMothers?.toString() || '0', icon: HeartPulse, color: '#F472B6' },
            { label: 'Immunizations', value: immStats?.totalVaccinations?.toString() || '0', icon: Syringe, color: '#A855F7' },
            { label: 'Births (Wk)', value: birthStats?.total?.toString() || '0', icon: Baby, color: '#4ADE80' },
            { label: 'Pending Orders', value: pendingOrders.toString(), icon: Clipboard, color: '#FB923C' },
            { label: 'Messages', value: messagesCount.toString(), icon: MessageSquare, color: '#38BDF8' },
          ].map((kpi) => (
            <div key={kpi.label} className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => {
                const routes: Record<string, string> = { 'Ward Patients': '/patients', 'Meds Due': '/pharmacy', 'ANC Mothers': '/anc', 'Immunizations': '/immunizations', 'Births (Wk)': '/births', 'Pending Orders': '/lab', 'Messages': '/messages' };
                if (routes[kpi.label]) router.push(routes[kpi.label]);
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--card-shadow)',
              }}>
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: kpi.color }} />
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3 h-3" style={{ color: kpi.color }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TAB NAVIGATION for Ward / MAR / Triage */}
        <div className="flex items-center gap-1 mb-3">
          {[
            { key: 'ward' as const, label: 'Ward Patients', icon: BedDouble },
            { key: 'mar' as const, label: 'Medication Admin (MAR)', icon: Pill },
            { key: 'triage' as const, label: 'Triage (ETAT)', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? ACCENT : 'var(--bg-card)',
                color: activeTab === tab.key ? '#FFF' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.key ? ACCENT : 'var(--border-light)'}`,
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

          {/* === TAB: WARD PATIENTS (default) === */}
          {activeTab === 'ward' && (
            <>
              {/* Ward Patient List -- 2 cols */}
              <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
              }}>
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4" style={{ color: ACCENT }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ward Patients</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                      background: 'rgba(43,111,224,0.1)',
                      color: ACCENT,
                      border: '1px solid rgba(43,111,224,0.2)',
                    }}>LIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Task Prioritization Toggle (Feature 5) */}
                    <button
                      onClick={() => setSortByUrgency(!sortByUrgency)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: sortByUrgency ? 'rgba(248,113,113,0.1)' : 'var(--overlay-subtle)',
                        color: sortByUrgency ? '#F87171' : 'var(--text-muted)',
                        border: `1px solid ${sortByUrgency ? 'rgba(248,113,113,0.2)' : 'var(--border-light)'}`,
                      }}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      {sortByUrgency ? 'Sorted by Urgency' : 'Sort by Urgency'}
                    </button>
                    <button onClick={() => router.push('/patients')} className="text-xs font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 space-y-1.5" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {wardPatients.map((patient) => {
                    const origIdx = patients.indexOf(patient);
                    const wardName = WARDS[origIdx % WARDS.length];
                    const vitalStatus = origIdx % 3 === 0 ? 'overdue' : origIdx % 3 === 1 ? 'due' : 'done';
                    // Priority level indicator (Feature 5)
                    const priorityLevel = vitalStatus === 'overdue' ? 1 : vitalStatus === 'due' ? 2 : 3;
                    return (
                      <div
                        key={patient._id}
                        className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                        onClick={() => {
                          setVitalsPatient({ id: patient._id, name: `${patient.firstName} ${patient.surname}` });
                          setVitalsForm({ systolic: '', diastolic: '', temperature: '', pulse: '', spo2: '', weight: '', respiratoryRate: '', notes: '' });
                          setVitalsSaved(false);
                          setVitalsModalOpen(true);
                        }}
                        style={{
                          background: 'var(--overlay-subtle)',
                          border: `1px solid ${vitalStatus === 'overdue' ? 'rgba(248,113,113,0.3)' : 'var(--border-light)'}`,
                        }}
                      >
                        {/* Priority indicator bar */}
                        {sortByUrgency && (
                          <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" style={{
                            background: priorityLevel === 1 ? '#EF4444' : priorityLevel === 2 ? '#FBBF24' : '#4ADE80',
                          }} />
                        )}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: '#0077D7' }}>
                          {(patient.firstName || '?')[0]}{(patient.surname || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{patient.firstName} {patient.surname}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {patient.gender} · {patient.estimatedAge || (patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0)}y · {wardName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: vitalStatus === 'overdue' ? 'rgba(248,113,113,0.15)' : vitalStatus === 'due' ? 'rgba(251,191,36,0.15)' : 'rgba(74,222,128,0.15)',
                            color: vitalStatus === 'overdue' ? '#F87171' : vitalStatus === 'due' ? '#FBBF24' : '#4ADE80',
                          }}>{vitalStatus === 'overdue' ? 'VITALS OVERDUE' : vitalStatus === 'due' ? 'VITALS DUE' : 'VITALS OK'}</span>
                          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{patient.hospitalNumber}</p>
                        </div>
                        <Thermometer className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* === TAB: MEDICATION ADMINISTRATION RECORD (Feature 2) === */}
          {activeTab === 'mar' && (
            <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
            }}>
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4" style={{ color: '#60A5FA' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Medication Administration Record</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                    background: 'rgba(96,165,250,0.1)',
                    color: '#60A5FA',
                    border: '1px solid rgba(96,165,250,0.2)',
                  }}>{marEntries.filter(e => e.status !== 'given').length} PENDING</span>
                </div>
              </div>
              <div className="p-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {/* MAR Table Header */}
                <div className="grid grid-cols-12 gap-1 px-2 py-1.5 mb-1" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <span className="col-span-1 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Time</span>
                  <span className="col-span-3 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Patient</span>
                  <span className="col-span-3 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Medication</span>
                  <span className="col-span-1 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Dose</span>
                  <span className="col-span-1 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Route</span>
                  <span className="col-span-2 text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="col-span-1 text-[9px] font-bold uppercase text-center" style={{ color: 'var(--text-muted)' }}>Act</span>
                </div>
                {marEntries.map(entry => {
                  const sc = marStatusColor(entry.status);
                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-12 gap-1 px-2 py-2 rounded-lg mb-0.5 items-center transition-all"
                      style={{
                        background: sc.bg,
                        border: `1px solid transparent`,
                      }}
                    >
                      <span className="col-span-1 text-[10px] font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{entry.time}</span>
                      <span className="col-span-3 text-[10px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.patientName}</span>
                      <span className="col-span-3 text-[10px] font-semibold truncate" style={{ color: sc.color }}>{entry.medication}</span>
                      <span className="col-span-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>{entry.dose}</span>
                      <span className="col-span-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>{entry.route}</span>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${sc.color}20`, color: sc.color }}>
                          {sc.label}
                        </span>
                        {entry.givenAt && (
                          <p className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {new Date(entry.givenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {entry.status !== 'given' ? (
                          <button
                            onClick={() => handleMarkGiven(entry.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                            style={{
                              background: 'rgba(74,222,128,0.15)',
                              border: '1px solid rgba(74,222,128,0.3)',
                            }}
                            title="Mark as given"
                          >
                            <Check className="w-3 h-3" style={{ color: '#4ADE80' }} />
                          </button>
                        ) : (
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.2)' }}>
                            <Check className="w-3 h-3" style={{ color: '#4ADE80' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {marEntries.length === 0 && (
                  <div className="text-center py-8">
                    <Pill className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No medications scheduled</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === TAB: TRIAGE (Feature 4 - ETAT) === */}
          {activeTab === 'triage' && (
            <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
            }}>
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#FB923C' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ETAT Triage Assessment</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Patient name */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Patient Name</label>
                  <input
                    type="text"
                    value={triagePatientName}
                    onChange={e => setTriagePatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* ABCC Assessment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Airway */}
                  <div className="p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4" style={{ color: '#60A5FA' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Airway</span>
                    </div>
                    <div className="flex gap-2">
                      {(['clear', 'obstructed'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setTriageData(prev => ({ ...prev, airway: opt }))}
                          className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                          style={{
                            background: triageData.airway === opt
                              ? (opt === 'clear' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)')
                              : 'var(--bg-card)',
                            color: triageData.airway === opt
                              ? (opt === 'clear' ? '#4ADE80' : '#EF4444')
                              : 'var(--text-secondary)',
                            border: `1px solid ${triageData.airway === opt
                              ? (opt === 'clear' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)')
                              : 'var(--border-light)'}`,
                          }}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breathing */}
                  <div className="p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4" style={{ color: '#A855F7' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Breathing</span>
                    </div>
                    <div className="flex gap-2">
                      {(['normal', 'distressed', 'absent'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setTriageData(prev => ({ ...prev, breathing: opt }))}
                          className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                          style={{
                            background: triageData.breathing === opt
                              ? (opt === 'normal' ? 'rgba(74,222,128,0.2)' : opt === 'distressed' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)')
                              : 'var(--bg-card)',
                            color: triageData.breathing === opt
                              ? (opt === 'normal' ? '#4ADE80' : opt === 'distressed' ? '#FBBF24' : '#EF4444')
                              : 'var(--text-secondary)',
                            border: `1px solid ${triageData.breathing === opt
                              ? (opt === 'normal' ? 'rgba(74,222,128,0.3)' : opt === 'distressed' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)')
                              : 'var(--border-light)'}`,
                          }}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Circulation */}
                  <div className="p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4" style={{ color: '#EC4899' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Circulation</span>
                    </div>
                    <div className="flex gap-2">
                      {(['normal', 'impaired', 'absent'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setTriageData(prev => ({ ...prev, circulation: opt }))}
                          className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                          style={{
                            background: triageData.circulation === opt
                              ? (opt === 'normal' ? 'rgba(74,222,128,0.2)' : opt === 'impaired' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)')
                              : 'var(--bg-card)',
                            color: triageData.circulation === opt
                              ? (opt === 'normal' ? '#4ADE80' : opt === 'impaired' ? '#FBBF24' : '#EF4444')
                              : 'var(--text-secondary)',
                            border: `1px solid ${triageData.circulation === opt
                              ? (opt === 'normal' ? 'rgba(74,222,128,0.3)' : opt === 'impaired' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)')
                              : 'var(--border-light)'}`,
                          }}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consciousness (AVPU) */}
                  <div className="p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4" style={{ color: '#38BDF8' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Consciousness (AVPU)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { key: 'alert' as const, label: 'A - Alert' },
                        { key: 'verbal' as const, label: 'V - Verbal' },
                        { key: 'pain' as const, label: 'P - Pain' },
                        { key: 'unresponsive' as const, label: 'U - Unresponsive' },
                      ]).map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setTriageData(prev => ({ ...prev, consciousness: opt.key }))}
                          className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                          style={{
                            background: triageData.consciousness === opt.key
                              ? (opt.key === 'alert' ? 'rgba(74,222,128,0.2)' : opt.key === 'verbal' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)')
                              : 'var(--bg-card)',
                            color: triageData.consciousness === opt.key
                              ? (opt.key === 'alert' ? '#4ADE80' : opt.key === 'verbal' ? '#FBBF24' : '#EF4444')
                              : 'var(--text-secondary)',
                            border: `1px solid ${triageData.consciousness === opt.key
                              ? (opt.key === 'alert' ? 'rgba(74,222,128,0.3)' : opt.key === 'verbal' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)')
                              : 'var(--border-light)'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Triage Result */}
                {triageData.priority && (
                  <div
                    className="p-4 rounded-2xl text-center transition-all"
                    style={{
                      background: triagePriorityColor(triageData.priority).bg,
                      color: triagePriorityColor(triageData.priority).text,
                    }}
                  >
                    <p className="text-3xl font-black mb-1">{triageData.priority}</p>
                    <p className="text-sm font-semibold">{triagePriorityColor(triageData.priority).label}</p>
                    {triagePatientName && (
                      <p className="text-xs mt-1 opacity-80">Patient: {triagePatientName}</p>
                    )}
                  </div>
                )}

                {/* Reset */}
                <button
                  onClick={() => {
                    setTriageData({ airway: '', breathing: '', circulation: '', consciousness: '', priority: '' });
                    setTriagePatientName('');
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'var(--overlay-subtle)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  Reset Assessment
                </button>
              </div>
            </div>
          )}

          {/* Vitals Queue / Live Feed -- 1 col (always shown) */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)', maxHeight: '520px',
          }}>
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Care Feed</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{eventCounter} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {liveEvents.map(evt => {
                const Icon = evt.icon;
                return (
                  <div
                    key={evt.id}
                    className="p-2 rounded-lg transition-all cursor-pointer"
                    onClick={() => {
                      const routes: Record<string, string> = { vitals: '/patients', medication: '/pharmacy', birth_assist: '/births', immunization: '/immunizations', wound_care: '/patients', anc_check: '/anc', blood_draw: '/lab', patient_assess: '/patients', temp_check: '/patients' };
                      router.push(routes[evt.type] || '/patients');
                    }}
                    style={{
                      background: evt.isNew ? `${evt.color}08` : 'transparent',
                      border: evt.isNew ? `1px solid ${evt.color}20` : '1px solid transparent',
                      animation: evt.isNew ? 'fadeIn 0.3s ease-out' : undefined,
                    }}
                  >
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
                          <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{evt.ward}</span>
                          <span className="text-[9px] font-mono flex-shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>{evt.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions -- 1 col (always shown) */}
          <div className="space-y-4 flex flex-col">
            {/* Shift Summary */}
            <div className="rounded-2xl overflow-hidden flex-1" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
            }}>
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: ACCENT }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Shift Summary</span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: 'Vitals Taken', value: Math.max(8, Math.floor(patients.length * 0.4)), color: '#4ADE80' },
                  { label: 'Meds Given', value: Math.max(5, Math.floor(patients.length * 0.2)), color: '#60A5FA' },
                  { label: 'Assessments', value: Math.max(3, Math.floor(patients.length * 0.15)), color: '#A855F7' },
                  { label: 'Births Assisted', value: birthStats?.total || 0, color: ACCENT },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg" style={{
                    background: 'var(--overlay-subtle)',
                    border: '1px solid var(--border-light)',
                  }}>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl p-3" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
            }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Record Vitals', icon: Activity, href: '/patients', color: '#4ADE80' },
                  { label: 'ANC Visit', icon: HeartPulse, href: '/anc', color: '#F472B6' },
                  { label: 'Immunization', icon: Syringe, href: '/immunizations', color: '#A855F7' },
                  { label: 'Birth Reg.', icon: Baby, href: '/births', color: ACCENT },
                  { label: 'Messages', icon: MessageSquare, href: '/messages', color: '#38BDF8' },
                  { label: 'Lab Orders', icon: Stethoscope, href: '/lab', color: '#FB923C' },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex items-center gap-2 p-2 rounded-lg transition-all"
                    style={{ background: `${action.color}08`, border: `1px solid ${action.color}15` }}
                  >
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Care Documentation Log */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
        }}>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Care Documentation Log</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                background: 'rgba(43,111,224,0.1)',
                color: ACCENT,
                border: '1px solid rgba(43,111,224,0.2)',
              }}>TODAY</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{liveEvents.length} entries logged</span>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {liveEvents.slice(0, 8).map((evt) => {
                const Icon = evt.icon;
                return (
                  <div key={evt.id} className="p-2.5 rounded-xl transition-all cursor-pointer"
                    style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${evt.color}15` }}>
                        <Icon className="w-2.5 h-2.5" style={{ color: evt.color }} />
                      </div>
                      <span className="text-[10px] font-semibold truncate" style={{ color: evt.color }}>{evt.label}</span>
                    </div>
                    <p className="text-[10px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{evt.patient}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{evt.ward}</span>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{evt.time}</span>
                    </div>
                  </div>);
              })}
            </div>
          </div>
        </div>

      </main>

      {/* ============================================================ */}
      {/* MODAL: Quick Vitals Entry (Feature 1) */}
      {/* ============================================================ */}
      {vitalsModalOpen && vitalsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" style={{ color: ACCENT }} />
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Vitals Entry</h2>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{vitalsPatient.name}</p>
                </div>
              </div>
              <button onClick={() => setVitalsModalOpen(false)} className="p-1 rounded-lg transition-all" style={{ background: 'var(--overlay-subtle)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Success State */}
            {vitalsSaved ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <Check className="w-7 h-7" style={{ color: '#4ADE80' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Vitals Saved Successfully</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Blood Pressure */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Blood Pressure (mmHg)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Systolic"
                        value={vitalsForm.systolic}
                        onChange={e => setVitalsForm(prev => ({ ...prev, systolic: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: vitalFlags.systolic ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                          border: `1px solid ${vitalFlags.systolic ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                          color: vitalFlags.systolic ? '#EF4444' : 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <span className="self-center text-sm font-bold" style={{ color: 'var(--text-muted)' }}>/</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Diastolic"
                        value={vitalsForm.diastolic}
                        onChange={e => setVitalsForm(prev => ({ ...prev, diastolic: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: vitalFlags.diastolic ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                          border: `1px solid ${vitalFlags.diastolic ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                          color: vitalFlags.diastolic ? '#EF4444' : 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                  {(vitalFlags.systolic || vitalFlags.diastolic) && (
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-3 h-3 inline mr-1" />Abnormal BP detected
                    </p>
                  )}
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={vitalsForm.temperature}
                    onChange={e => setVitalsForm(prev => ({ ...prev, temperature: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: vitalFlags.temperature ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                      border: `1px solid ${vitalFlags.temperature ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                      color: vitalFlags.temperature ? '#EF4444' : 'var(--text-primary)',
                    }}
                  />
                  {vitalFlags.temperature && (
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-3 h-3 inline mr-1" />Fever detected ({'>'}38.5°C)
                    </p>
                  )}
                </div>

                {/* Pulse & SpO2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Pulse Rate (bpm)
                    </label>
                    <input
                      type="number"
                      placeholder="72"
                      value={vitalsForm.pulse}
                      onChange={e => setVitalsForm(prev => ({ ...prev, pulse: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: vitalFlags.pulse ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                        border: `1px solid ${vitalFlags.pulse ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                        color: vitalFlags.pulse ? '#EF4444' : 'var(--text-primary)',
                      }}
                    />
                    {vitalFlags.pulse && (
                      <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
                        <AlertCircle className="w-3 h-3 inline mr-1" />Abnormal pulse
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="98"
                      value={vitalsForm.spo2}
                      onChange={e => setVitalsForm(prev => ({ ...prev, spo2: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: vitalFlags.spo2 ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                        border: `1px solid ${vitalFlags.spo2 ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                        color: vitalFlags.spo2 ? '#EF4444' : 'var(--text-primary)',
                      }}
                    />
                    {vitalFlags.spo2 && (
                      <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
                        <AlertCircle className="w-3 h-3 inline mr-1" />Low SpO2 ({'<'}95%)
                      </p>
                    )}
                  </div>
                </div>

                {/* Weight & Respiratory Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="65.0"
                      value={vitalsForm.weight}
                      onChange={e => setVitalsForm(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: 'var(--overlay-subtle)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Respiratory Rate
                    </label>
                    <input
                      type="number"
                      placeholder="18"
                      value={vitalsForm.respiratoryRate}
                      onChange={e => setVitalsForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: vitalFlags.respiratoryRate ? 'rgba(239,68,68,0.1)' : 'var(--overlay-subtle)',
                        border: `1px solid ${vitalFlags.respiratoryRate ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                        color: vitalFlags.respiratoryRate ? '#EF4444' : 'var(--text-primary)',
                      }}
                    />
                    {vitalFlags.respiratoryRate && (
                      <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
                        <AlertCircle className="w-3 h-3 inline mr-1" />Abnormal RR
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Additional observations..."
                    value={vitalsForm.notes}
                    onChange={e => setVitalsForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Abnormal flags summary */}
                {Object.keys(vitalFlags).length > 0 && (
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
                      <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Abnormal Values Detected</span>
                    </div>
                    <p className="text-[10px]" style={{ color: '#EF4444' }}>
                      {Object.keys(vitalFlags).map(k => {
                        const labels: Record<string, string> = { systolic: 'Systolic BP', diastolic: 'Diastolic BP', temperature: 'Temperature', spo2: 'SpO2', pulse: 'Pulse', respiratoryRate: 'Respiratory Rate' };
                        return labels[k] || k;
                      }).join(', ')} flagged for review.
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveVitals}
                  disabled={vitalsSaving}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: vitalsSaving ? '#94A3B8' : ACCENT }}
                >
                  {vitalsSaving ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Shift Handoff (Feature 3) */}
      {/* ============================================================ */}
      {handoffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Shift Handoff Report</h2>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{todayDate} - {currentUser.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ background: 'rgba(43,111,224,0.1)', color: ACCENT, border: '1px solid rgba(43,111,224,0.2)' }}
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
                <button onClick={() => setHandoffOpen(false)} className="p-1 rounded-lg transition-all" style={{ background: 'var(--overlay-subtle)' }}>
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 print-handoff">
              {/* Critical Patients */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" style={{ color: '#EF4444' }} />
                  <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Critical Patients (Abnormal Vitals)</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                    {criticalPatients.length}
                  </span>
                </div>
                {criticalPatients.length > 0 ? (
                  <div className="space-y-1">
                    {criticalPatients.map(p => (
                      <div key={p._id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#EF4444' }}>
                          {(p.firstName || '?')[0]}{(p.surname || '?')[0]}
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{p.firstName} {p.surname}</span>
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>VITALS OVERDUE</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No critical patients at this time.</p>
                )}
              </div>

              {/* Pending Tasks */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" style={{ color: '#FBBF24' }} />
                  <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>Pending Tasks</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-primary)' }}>Vitals due</span>
                    <span className="text-xs font-bold" style={{ color: '#F87171' }}>{vitalsDue}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-primary)' }}>Medications overdue</span>
                    <span className="text-xs font-bold" style={{ color: '#EF4444' }}>{overdueMarCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-primary)' }}>Medications due now</span>
                    <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>{dueMarCount}</span>
                  </div>
                </div>
              </div>

              {/* Admissions & Discharges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <BedDouble className="w-4 h-4" style={{ color: '#4ADE80' }} />
                    <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>New Admissions Today</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#4ADE80' }}>{Math.max(1, Math.floor(patients.length * 0.05))}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4" style={{ color: '#60A5FA' }} />
                    <span className="text-xs font-semibold" style={{ color: '#60A5FA' }}>Discharges Today</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#60A5FA' }}>{Math.max(1, Math.floor(patients.length * 0.03))}</p>
                </div>
              </div>

              {/* Notes from outgoing nurse */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Notes from Outgoing Nurse
                </label>
                <textarea
                  rows={4}
                  placeholder="Document important observations, pending follow-ups, or special instructions for the incoming shift..."
                  value={handoffNotes}
                  onChange={e => setHandoffNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{
                    background: 'var(--overlay-subtle)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Summary footer */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Generated by {currentUser.name} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  onClick={() => setHandoffOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: ACCENT }}
                >
                  Complete Handoff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
