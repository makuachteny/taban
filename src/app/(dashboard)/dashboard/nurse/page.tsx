'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Shield, Droplets, Bandage
} from 'lucide-react';

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

const ACCENT = '#2B6FE0';

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

  if (!currentUser) return null;

  const hospital = currentUser.hospital;
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayName = currentUser.name.split(' ')[1] || currentUser.name.split(' ')[0];
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  const wardPatients = patients.slice(0, 8).filter(p =>
    !globalSearch || `${p.firstName} ${p.surname}`.toLowerCase().includes(globalSearch.toLowerCase()) || p.hospitalNumber.toLowerCase().includes(globalSearch.toLowerCase())
  );
  const vitalsDue = Math.max(4, Math.floor(patients.length * 0.3));
  const medsDue = Math.max(6, Math.floor(patients.length * 0.25));
  const pendingOrders = Math.max(3, labResults.length > 0 ? Math.floor(labResults.length * 0.15) : 5);
  const messagesCount = Math.max(2, Math.floor(Math.random() * 4) + 2);

  return (
    <>
      <TopBar title="Nurse Station" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* COMMAND CENTER HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: '#2B6FE0',
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
          <div className="flex items-center gap-4">
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

        {/* MAIN GRID: Ward List + Vitals Queue + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

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
              <button onClick={() => router.push('/patients')} className="text-xs font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {wardPatients.map((patient, idx) => {
                const wardName = WARDS[idx % WARDS.length];
                const vitalStatus = idx % 3 === 0 ? 'overdue' : idx % 3 === 1 ? 'due' : 'done';
                return (
                  <div
                    key={patient._id}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                    onClick={() => router.push(`/patients/${patient._id}`)}
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: '#2B6FE0' }}>
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
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vitals Queue / Live Feed -- 1 col */}
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

          {/* Quick Actions -- 1 col */}
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
    </>
  );
}
