'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { useLabResults } from '@/lib/hooks/useLabResults';
import {
  FlaskConical, Clock, CheckCircle2, AlertTriangle, Activity, Zap,
  Radio, TestTubes, Microscope, Droplets, FileText,
  MessageSquare, ChevronRight, Beaker, Thermometer, Loader2,
} from 'lucide-react';

const ACCENT = '#2B6FE0';

const LAB_EVENT_TYPES = [
  { label: 'Specimen Received', color: '#06B6D4', icon: Droplets },
  { label: 'Centrifuge Started', color: '#A855F7', icon: Loader2 },
  { label: 'Malaria RDT Completed', color: '#4ADE80', icon: Microscope },
  { label: 'Critical Hemoglobin Flagged', color: '#F87171', icon: AlertTriangle },
  { label: 'CBC Analysis Running', color: '#60A5FA', icon: Activity },
  { label: 'Urinalysis Complete', color: '#FBBF24', icon: Beaker },
  { label: 'Blood Culture Incubated', color: '#EC4899', icon: Thermometer },
  { label: 'Result Validated', color: '#2B6FE0', icon: CheckCircle2 },
  { label: 'Specimen Rejected - Hemolyzed', color: '#EF4444', icon: AlertTriangle },
  { label: 'Glucose Result Ready', color: '#38BDF8', icon: FlaskConical },
];

const SAMPLE_PATIENTS = [
  'Deng Mabior', 'Achol Mayen', 'Nyamal Koang', 'Gatluak Ruot', 'Ayen Dut',
  'Kuol Akot', 'Ladu Tombe', 'Rose Gbudue', 'Majok Chol', 'Nyandit Dut',
  'Abuk Deng', 'Garang Makuei', 'Awut Makuei', 'Nyandeng Chol', 'Tut Chuol',
];

interface LiveEvent {
  id: number;
  label: string;
  color: string;
  icon: typeof Activity;
  patient: string;
  time: string;
  isNew: boolean;
}

export default function LabDashboardPage() {
  const { currentUser } = useApp();
  const router = useRouter();
  const { results, loading } = useLabResults();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  // --- Derived KPIs ---
  const kpis = useMemo(() => {
    const pending = results.filter(r => r.status === 'pending').length;
    const inProgress = results.filter(r => r.status === 'in_progress').length;
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = results.filter(r => r.status === 'completed' && r.completedAt?.startsWith(today)).length;
    const critical = results.filter(r => r.critical).length;
    const abnormal = results.filter(r => r.abnormal).length;
    const completed = results.filter(r => r.status === 'completed' && r.completedAt && r.orderedAt);
    const avgTurnaround = completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + (new Date(r.completedAt).getTime() - new Date(r.orderedAt).getTime()) / 3600000, 0) / completed.length)
      : 0;
    const specimens = new Set(results.map(r => r.specimen)).size;
    return { pending, inProgress, completedToday, critical, abnormal, avgTurnaround, specimens, total: results.length };
  }, [results]);

  // --- Simulated live events ---
  const generateEvent = useCallback((): LiveEvent => {
    const evt = LAB_EVENT_TYPES[Math.floor(Math.random() * LAB_EVENT_TYPES.length)];
    const now = new Date();
    return {
      id: Date.now() + Math.random(),
      ...evt,
      patient: SAMPLE_PATIENTS[Math.floor(Math.random() * SAMPLE_PATIENTS.length)],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isNew: true,
    };
  }, []);

  useEffect(() => {
    const initial: LiveEvent[] = [];
    for (let i = 0; i < 5; i++) initial.push({ ...generateEvent(), isNew: false, id: i });
    setLiveEvents(initial);

    const interval = setInterval(() => {
      setLiveEvents(prev => [generateEvent(), ...prev.slice(0, 8).map(e => ({ ...e, isNew: false }))]);
      setEventCounter(c => c + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [generateEvent]);

  // --- Categorized results ---
  const pendingOrders = useMemo(() => results.filter(r => r.status === 'pending' || r.status === 'in_progress').slice(0, 8), [results]);
  const recentCompleted = useMemo(() => results.filter(r => r.status === 'completed').slice(0, 6), [results]);
  const specimenCounts = useMemo(() => {
    const map: Record<string, number> = {};
    results.forEach(r => { map[r.specimen] = (map[r.specimen] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [results]);

  if (loading) {
    return (
      <>
        <TopBar title="Laboratory" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        </main>
      </>
    );
  }

  const kpiStrip = [
    { label: 'Pending Orders', value: kpis.pending, icon: Clock, color: '#FBBF24' },
    { label: 'In Progress', value: kpis.inProgress, icon: Loader2, color: '#A855F7' },
    { label: 'Completed Today', value: kpis.completedToday, icon: CheckCircle2, color: '#4ADE80' },
    { label: 'Critical Results', value: kpis.critical, icon: AlertTriangle, color: '#EF4444' },
    { label: 'Abnormal', value: kpis.abnormal, icon: AlertTriangle, color: '#FB923C' },
    { label: 'Avg Turnaround', value: `${kpis.avgTurnaround}h`, icon: Zap, color: '#38BDF8' },
    { label: 'Specimens', value: kpis.specimens, icon: Droplets, color: '#EC4899' },
    { label: 'Total Tests', value: kpis.total, icon: TestTubes, color: ACCENT },
  ];

  const quickActions = [
    { label: 'Accept Order', icon: FileText, color: '#4ADE80' },
    { label: 'Enter Result', icon: Microscope, color: ACCENT },
    { label: 'Flag Critical', icon: AlertTriangle, color: '#EF4444' },
    { label: 'Message', icon: MessageSquare, color: '#60A5FA' },
  ];

  return (
    <>
      <TopBar title="Laboratory" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* --- Command Center Header --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: '#2B6FE0',
            }}>
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Laboratory
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {currentUser?.hospital?.name || currentUser?.hospitalName || 'Laboratory'} &middot; {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3" style={{ color: ACCENT }} />
                <span>{eventCounter} lab events tracked</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- KPI Strip --- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {kpiStrip.map((kpi) => (
            <div key={kpi.label} className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden" onClick={() => router.push('/lab')} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
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

        {/* --- Main Grid: Orders Queue (2col) + Specimen Pipeline (1col) + Result Entry (1col) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

          {/* Orders Queue Table - 2 columns */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Orders Queue</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                  background: 'rgba(6,182,212,0.1)', color: ACCENT, border: '1px solid rgba(6,182,212,0.2)',
                }}>{pendingOrders.length} ACTIVE</span>
              </div>
              <button className="text-[10px] font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {pendingOrders.length > 0 ? pendingOrders.map(order => (
                <div key={order._id} className="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer" onClick={() => router.push('/lab')} style={{
                  background: 'var(--overlay-subtle)', border: `1px solid ${order.critical ? 'rgba(239,68,68,0.25)' : 'var(--border-light)'}`,
                }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: order.status === 'in_progress' ? 'rgba(168,85,247,0.12)' : 'rgba(251,191,36,0.12)',
                  }}>
                    {order.status === 'in_progress'
                      ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#A855F7' }} />
                      : <Clock className="w-4 h-4" style={{ color: '#FBBF24' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{order.testName}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{order.patientName} &middot; {order.specimen}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: order.status === 'in_progress' ? 'rgba(168,85,247,0.12)' : 'rgba(251,191,36,0.12)',
                      color: order.status === 'in_progress' ? '#A855F7' : '#FBBF24',
                    }}>{order.status === 'in_progress' ? 'PROCESSING' : 'PENDING'}</span>
                    {order.critical && (
                      <div className="mt-1">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>CRITICAL</span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FlaskConical className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.15 }} />
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No pending orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Specimen Pipeline - 1 column */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
          }}>
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4" style={{ color: '#EC4899' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Specimen Pipeline</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {specimenCounts.length > 0 ? specimenCounts.map(([specimen, count]) => {
                const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                return (
                  <div key={specimen} className="p-2.5 rounded-xl transition-all" style={{
                    background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)',
                  }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{specimen}</span>
                      <span className="text-[10px] font-bold" style={{ color: ACCENT }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${pct}%`, background: ACCENT,
                      }} />
                    </div>
                    <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>{pct}% of total</p>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Droplets className="w-6 h-6 mb-1" style={{ color: 'var(--text-muted)', opacity: 0.15 }} />
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No specimen data</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Feed + Quick Actions - 1 column */}
          <div className="space-y-4 flex flex-col">
            {/* Live Feed */}
            <div className="rounded-2xl overflow-hidden flex-1 flex flex-col" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)', maxHeight: '260px',
            }}>
              <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" style={{ color: '#4ADE80' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Feed</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{eventCounter} events</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {liveEvents.map(evt => {
                  const Icon = evt.icon;
                  return (
                    <div key={evt.id} className="p-2 rounded-lg transition-all" style={{
                      background: evt.isNew ? `${evt.color}08` : 'transparent',
                      border: evt.isNew ? `1px solid ${evt.color}20` : '1px solid transparent',
                      animation: evt.isNew ? 'fadeIn 0.3s ease-out' : undefined,
                    }}>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${evt.color}15` }}>
                          <Icon className="w-2.5 h-2.5" style={{ color: evt.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold truncate" style={{ color: evt.color }}>{evt.label}</span>
                            {evt.isNew && (
                              <span className="text-[7px] font-bold px-1 py-0.5 rounded" style={{ background: `${evt.color}20`, color: evt.color }}>NEW</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{evt.patient}</span>
                            <span className="text-[9px] font-mono flex-shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>{evt.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl p-3" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
            }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickActions.map(action => (
                  <button key={action.label} className="flex items-center gap-2 p-2 rounded-lg transition-all" style={{
                    background: `${action.color}08`, border: `1px solid ${action.color}15`,
                  }}>
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- Bottom: Recent Completed Results --- */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
        }}>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#4ADE80' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Completed Results</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{recentCompleted.length} results</span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recentCompleted.length > 0 ? recentCompleted.map(r => (
                <div key={r._id} className="p-3 rounded-xl transition-all cursor-pointer" style={{
                  background: 'var(--overlay-subtle)',
                  border: `1px solid ${r.critical ? 'rgba(239,68,68,0.25)' : r.abnormal ? 'rgba(251,146,60,0.25)' : 'var(--border-light)'}`,
                }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.testName}</span>
                    {r.critical ? (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>CRITICAL</span>
                    ) : r.abnormal ? (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(251,146,60,0.12)', color: '#FB923C' }}>ABNORMAL</span>
                    ) : (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>NORMAL</span>
                    )}
                  </div>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>{r.patientName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold stat-value" style={{
                      color: r.critical ? '#EF4444' : r.abnormal ? '#FB923C' : ACCENT,
                    }}>{r.result} {r.unit}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{r.referenceRange}</span>
                  </div>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>{r.specimen} &middot; {r.completedAt ? new Date(r.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              )) : (
                <div className="col-span-2 sm:col-span-3 flex flex-col items-center justify-center py-8 text-center">
                  <Microscope className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.15 }} />
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No completed results yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
