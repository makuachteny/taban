'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePatients } from '@/lib/hooks/usePatients';
import { useReferrals } from '@/lib/hooks/useReferrals';
import {
  Users, Calendar, ClipboardCheck, ArrowRightLeft, MessageSquare,
  Activity, UserPlus, Clock, ChevronRight, Shield, Wifi,
  Radio, LogIn, Bell, FileText, ClipboardList
} from 'lucide-react';

const ACCENT = '#2B6FE0';

const EVENT_TYPES = [
  { type: 'arrival', label: 'Patient Arrived', color: '#14B8A6', icon: LogIn },
  { type: 'registered', label: 'Patient Registered', color: '#60A5FA', icon: UserPlus },
  { type: 'checked_in', label: 'Patient Checked In', color: '#4ADE80', icon: ClipboardCheck },
  { type: 'appointment', label: 'Appointment Scheduled', color: '#A855F7', icon: Calendar },
  { type: 'referral', label: 'Referral Received', color: '#FCD34D', icon: ArrowRightLeft },
  { type: 'message', label: 'Message Sent', color: '#FB923C', icon: MessageSquare },
  { type: 'triage', label: 'Triage Complete', color: '#EC4899', icon: Activity },
  { type: 'discharge', label: 'Patient Discharged', color: '#38BDF8', icon: FileText },
];

const SAMPLE_PATIENTS = [
  'Deng Mabior', 'Achol Mayen', 'Nyamal Koang', 'Gatluak Ruot', 'Ayen Dut',
  'Kuol Akot', 'Ladu Tombe', 'Rose Gbudue', 'Majok Chol', 'Nyandit Dut',
  'Abuk Deng', 'Garang Makuei', 'Awut Makuei', 'Nyandeng Chol', 'Tut Chuol',
];

const DEPARTMENTS = ['OPD', 'Emergency', 'Maternity', 'Pediatrics', 'Surgery', 'Pharmacy'];

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

export default function FrontDeskDashboardPage() {
  const router = useRouter();
  const { currentUser, globalSearch } = useApp();
  const { patients } = usePatients();
  const { referrals } = useReferrals();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  const generateEvent = useCallback((): LiveEvent => {
    const evtType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const now = new Date();
    return {
      id: Date.now() + Math.random(),
      ...evtType,
      patient: SAMPLE_PATIENTS[Math.floor(Math.random() * SAMPLE_PATIENTS.length)],
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isNew: true,
    };
  }, []);

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
  const pendingReferrals = referrals.filter(r => r.status === 'sent' || r.status === 'received');

  const recentPatients = patients.slice(0, 8).filter(p =>
    !globalSearch ||
    `${p.firstName} ${p.surname}`.toLowerCase().includes(globalSearch.toLowerCase()) ||
    p.hospitalNumber.toLowerCase().includes(globalSearch.toLowerCase())
  );

  // Simulated queue data
  const waitingQueue = SAMPLE_PATIENTS.slice(0, 5).map((name, i) => ({
    name,
    waitTime: `${Math.floor(Math.random() * 45) + 5}m`,
    priority: i === 0 ? 'urgent' : i < 2 ? 'normal' : 'routine',
    dept: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
  }));

  const upcomingAppointments = SAMPLE_PATIENTS.slice(5, 10).map((name, i) => {
    const hour = 8 + i;
    return {
      name,
      time: `${hour.toString().padStart(2, '0')}:${(i * 15 % 60).toString().padStart(2, '0')}`,
      dept: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      status: i < 2 ? 'arrived' : i < 4 ? 'confirmed' : 'pending',
    };
  });

  return (
    <>
      <TopBar title="Reception Center" />
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
                <Wifi className="w-3 h-3" style={{ color: '#4ADE80' }} />
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
            { label: 'Check-ins', value: Math.floor(patients.length * 0.6).toString(), icon: ClipboardCheck, color: '#4ADE80' },
            { label: 'Appointments', value: upcomingAppointments.length.toString(), icon: Calendar, color: '#60A5FA' },
            { label: 'Referrals', value: pendingReferrals.length.toString(), icon: ArrowRightLeft, color: '#FCD34D' },
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
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: kpi.color }} />
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3 h-3" style={{ color: kpi.color }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

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
                const priorityColor = item.priority === 'urgent' ? '#F87171' : item.priority === 'normal' ? '#FBBF24' : '#4ADE80';
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    onClick={() => router.push('/patients')}
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: `1px solid var(--border-light)`,
                      borderLeft: `3px solid ${priorityColor}`,
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: '#2B6FE0' }}>
                      {item.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.dept}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: `${priorityColor}15`,
                        color: priorityColor,
                        border: `1px solid ${priorityColor}30`,
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
                const statusColor = appt.status === 'arrived' ? '#4ADE80' : appt.status === 'confirmed' ? '#60A5FA' : '#FBBF24';
                return (
                  <div key={idx} className="p-2.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: 'var(--overlay-subtle)',
                      border: '1px solid var(--border-light)',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{appt.name}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`,
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
                    {['Patient', 'ID', 'Gender', 'Age', 'Last Visit', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map(patient => (
                    <tr key={patient._id} className="cursor-pointer transition-all"
                      onClick={() => router.push(`/patients/${patient._id}`)}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--overlay-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ background: '#2B6FE0' }}>
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
                      <td className="px-4 py-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>{patient.lastVisitDate}</td>
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
                { label: 'Check In', icon: ClipboardCheck, href: '/patients', color: '#4ADE80' },
                { label: 'Referrals', icon: ArrowRightLeft, href: '/referrals', color: '#FCD34D' },
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
                  { label: 'Pending', value: pendingReferrals.length, color: '#FBBF24' },
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
