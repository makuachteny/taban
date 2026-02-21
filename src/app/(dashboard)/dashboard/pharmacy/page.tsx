'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import {
  Pill, AlertTriangle, Package, Clock, ShieldCheck, Archive,
  MessageSquare, Activity, Radio, Zap, Wifi, ChevronRight,
  Search, ClipboardList, Send, TrendingDown, CheckCircle2, XCircle,
} from 'lucide-react';

const ACCENT = '#2B6FE0';

const EVENT_TYPES = [
  { type: 'rx_received', label: 'Prescription Received', color: '#60A5FA', icon: ClipboardList },
  { type: 'dispensed', label: 'Medication Dispensed', color: '#4ADE80', icon: CheckCircle2 },
  { type: 'stock_alert', label: 'Stock Alert Triggered', color: '#F87171', icon: AlertTriangle },
  { type: 'controlled', label: 'Controlled Substance Logged', color: '#A855F7', icon: ShieldCheck },
  { type: 'expired', label: 'Expired Item Flagged', color: '#EF4444', icon: XCircle },
  { type: 'pickup', label: 'Awaiting Patient Pickup', color: ACCENT, icon: Clock },
  { type: 'restock', label: 'Restock Order Placed', color: '#38BDF8', icon: Package },
  { type: 'message', label: 'Pharmacist Message', color: '#EC4899', icon: MessageSquare },
];

const PATIENTS = [
  'Deng Mabior', 'Achol Mayen', 'Nyamal Koang', 'Gatluak Ruot', 'Ayen Dut',
  'Kuol Akot', 'Ladu Tombe', 'Rose Gbudue', 'Majok Chol', 'Nyandit Dut',
];

const MEDICATIONS = [
  'Artemether-Lumefantrine', 'Amoxicillin 500mg', 'Metformin 500mg', 'TDF/3TC/DTG',
  'Ferrous Sulfate', 'Paracetamol 1g', 'Ciprofloxacin 500mg', 'ORS Sachets',
  'Diazepam 5mg', 'Morphine 10mg', 'Insulin Glargine', 'Salbutamol Inhaler',
];

const PRESCRIPTION_QUEUE = [
  { id: 'rx-001', patient: 'Deng Mabior Garang', medication: 'Artemether-Lumefantrine', dose: '80/480mg BD x 3d', prescriber: 'Dr. James Wani', time: '09:15', status: 'pending', priority: 'urgent' },
  { id: 'rx-002', patient: 'Nyamal Koang Gatdet', medication: 'Ferrous Sulfate + Folic Acid', dose: '200mg OD x 30d', prescriber: 'Dr. Achol Mayen', time: '09:30', status: 'pending', priority: 'routine' },
  { id: 'rx-003', patient: 'Gatluak Ruot Nyuon', medication: 'TDF/3TC/DTG', dose: '300/300/50mg OD x 90d', prescriber: 'Dr. Taban Ladu', time: '10:00', status: 'dispensed', priority: 'routine' },
  { id: 'rx-004', patient: 'Rose Tombura Gbudue', medication: 'Metformin', dose: '500mg BD x 30d', prescriber: 'CO Deng Mabior', time: '10:15', status: 'pending', priority: 'routine' },
  { id: 'rx-005', patient: 'Kuol Akot Ajith', medication: 'Morphine 10mg', dose: 'PRN q4h x 3d', prescriber: 'Dr. Nyamal Koang', time: '10:45', status: 'pending', priority: 'urgent' },
  { id: 'rx-006', patient: 'Achol Mayen Ring', medication: 'Amoxicillin', dose: '500mg TDS x 7d', prescriber: 'Dr. James Wani', time: '11:00', status: 'awaiting_pickup', priority: 'routine' },
  { id: 'rx-007', patient: 'Majok Chol Deng', medication: 'Insulin Glargine', dose: '20 IU OD', prescriber: 'Dr. Taban Ladu', time: '11:20', status: 'pending', priority: 'urgent' },
];

const STOCK_ALERTS = [
  { name: 'Artemether-Lumefantrine', stock: 12, reorder: 100, unit: 'packs', status: 'critical' as const },
  { name: 'ORS Sachets', stock: 28, reorder: 200, unit: 'sachets', status: 'critical' as const },
  { name: 'Amoxicillin 250mg Susp', stock: 45, reorder: 80, unit: 'bottles', status: 'low' as const },
  { name: 'Diazepam 5mg', stock: 8, reorder: 30, unit: 'ampoules', status: 'critical' as const },
  { name: 'Ferrous Sulfate', stock: 67, reorder: 100, unit: 'tablets', status: 'low' as const },
  { name: 'Paracetamol Syrup', stock: 15, reorder: 50, unit: 'bottles', status: 'critical' as const },
];

const INVENTORY_OVERVIEW = [
  { category: 'Antimalarials', total: 340, adequate: 280, low: 48, critical: 12 },
  { category: 'Antibiotics', total: 520, adequate: 410, low: 85, critical: 25 },
  { category: 'ARVs', total: 180, adequate: 165, low: 15, critical: 0 },
  { category: 'Analgesics', total: 290, adequate: 245, low: 30, critical: 15 },
  { category: 'Controlled', total: 45, adequate: 32, low: 8, critical: 5 },
  { category: 'Maternal Health', total: 160, adequate: 130, low: 22, critical: 8 },
];

interface LiveEvent {
  id: number;
  type: string;
  label: string;
  color: string;
  icon: typeof Activity;
  patient: string;
  medication: string;
  time: string;
  isNew: boolean;
}

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);
  const [dataRate, setDataRate] = useState(0);

  const generateEvent = useCallback((): LiveEvent => {
    const evtType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const now = new Date();
    return {
      id: Date.now() + Math.random(),
      ...evtType,
      patient: PATIENTS[Math.floor(Math.random() * PATIENTS.length)],
      medication: MEDICATIONS[Math.floor(Math.random() * MEDICATIONS.length)],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isNew: true,
    };
  }, []);

  useEffect(() => {
    const initial: LiveEvent[] = [];
    for (let i = 0; i < 5; i++) {
      initial.push({ ...generateEvent(), isNew: false, id: i });
    }
    setLiveEvents(initial);

    const interval = setInterval(() => {
      setLiveEvents(prev => {
        const newEvent = generateEvent();
        return [newEvent, ...prev.slice(0, 9).map(e => ({ ...e, isNew: false }))];
      });
      setEventCounter(c => c + 1);
      setDataRate(14 + Math.floor(Math.random() * 10) - 5);
    }, 5000);

    return () => clearInterval(interval);
  }, [generateEvent]);

  const pendingRx = PRESCRIPTION_QUEUE.filter(r => r.status === 'pending').length;
  const dispensedToday = PRESCRIPTION_QUEUE.filter(r => r.status === 'dispensed').length;
  const lowStockCount = STOCK_ALERTS.filter(a => a.status === 'low').length;
  const criticalCount = STOCK_ALERTS.filter(a => a.status === 'critical').length;
  const awaitingPickup = PRESCRIPTION_QUEUE.filter(r => r.status === 'awaiting_pickup').length;
  const controlledCount = PRESCRIPTION_QUEUE.filter(r => r.medication.includes('Morphine') || r.medication.includes('Diazepam')).length;
  const totalMeds = INVENTORY_OVERVIEW.reduce((s, c) => s + c.total, 0);

  return (
    <>
      <TopBar title="Pharmacy Operations" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* Command Center Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: '#2B6FE0',
            }}>
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Pharmacy
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {currentUser?.hospitalName ? ` · ${currentUser.hospitalName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1"><Zap className="w-3 h-3" style={{ color: ACCENT }} /><span>{dataRate || 14} dispensing/hr</span></div>
              <div className="flex items-center gap-1"><Wifi className="w-3 h-3" style={{ color: '#4ADE80' }} /><span>Inventory Synced</span></div>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {[
            { label: 'Pending Rx', value: pendingRx, icon: ClipboardList, color: ACCENT },
            { label: 'Dispensed', value: dispensedToday, icon: CheckCircle2, color: '#4ADE80' },
            { label: 'Low Stock', value: lowStockCount, icon: TrendingDown, color: '#FBBF24' },
            { label: 'Expired', value: 3, icon: XCircle, color: '#F87171' },
            { label: 'Pickup', value: awaitingPickup, icon: Clock, color: '#38BDF8' },
            { label: 'Controlled', value: controlledCount, icon: ShieldCheck, color: '#A855F7' },
            { label: 'Total Meds', value: totalMeds.toLocaleString(), icon: Archive, color: '#60A5FA' },
            { label: 'Messages', value: 4, icon: MessageSquare, color: '#EC4899' },
          ].map((kpi) => (
            <div key={kpi.label} className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden" onClick={() => router.push('/pharmacy')} style={{
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

          {/* Prescription Queue - 2 cols */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Prescription Queue</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{
                  background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30`,
                }}>{pendingRx} PENDING</span>
              </div>
              <button onClick={() => router.push('/pharmacy')} className="text-[10px] font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {PRESCRIPTION_QUEUE.map(rx => (
                <div key={rx.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:shadow-md cursor-pointer" onClick={() => router.push('/pharmacy')} style={{
                  background: rx.priority === 'urgent' ? `${ACCENT}08` : 'var(--overlay-subtle)',
                  border: `1px solid ${rx.priority === 'urgent' ? `${ACCENT}25` : 'var(--border-light)'}`,
                }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{
                    background: '#2B6FE0',
                  }}>
                    {rx.patient.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{rx.patient}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {rx.medication} · {rx.dose}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{rx.prescriber} · {rx.time}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: rx.status === 'dispensed' ? 'rgba(74,222,128,0.15)' :
                        rx.status === 'awaiting_pickup' ? 'rgba(56,189,248,0.15)' : `${ACCENT}15`,
                      color: rx.status === 'dispensed' ? '#4ADE80' :
                        rx.status === 'awaiting_pickup' ? '#38BDF8' : ACCENT,
                    }}>{rx.status === 'awaiting_pickup' ? 'PICKUP' : rx.status.toUpperCase()}</span>
                    {rx.priority === 'urgent' && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: 'rgba(248,113,113,0.15)', color: '#F87171',
                      }}>URGENT</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alerts - 1 col */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)', maxHeight: '460px',
          }}>
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: '#F87171' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Stock Alerts</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                background: 'rgba(248,113,113,0.12)', color: '#F87171',
              }}>{criticalCount} CRITICAL</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {STOCK_ALERTS.map((item, i) => {
                const pct = Math.round((item.stock / item.reorder) * 100);
                return (
                  <div key={i} className="p-2.5 rounded-lg transition-all" style={{
                    background: item.status === 'critical' ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.06)',
                    border: `1px solid ${item.status === 'critical' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)'}`,
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1" style={{
                        background: item.status === 'critical' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                        color: item.status === 'critical' ? '#F87171' : '#FBBF24',
                      }}>{item.status.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <span>{item.stock} / {item.reorder} {item.unit}</span>
                      <span style={{ color: item.status === 'critical' ? '#F87171' : '#FBBF24' }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--overlay-subtle)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${pct}%`,
                        background: item.status === 'critical' ? '#EF4444' : '#F59E0B',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dispensing Activity Feed - 1 col */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)', maxHeight: '460px',
          }}>
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" style={{ color: '#4ADE80' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activity Feed</span>
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
                          <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{evt.medication}</span>
                          <span className="text-[9px] font-mono flex-shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>{evt.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Inventory Overview + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Inventory Overview - 3 cols */}
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Inventory Overview</span>
              </div>
              <button onClick={() => router.push('/pharmacy')} className="text-[10px] font-medium flex items-center gap-1" style={{ color: ACCENT }}>
                Full inventory <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INVENTORY_OVERVIEW.map((cat) => {
                const adequatePct = Math.round((cat.adequate / cat.total) * 100);
                return (
                  <div key={cat.category} className="p-3 rounded-xl transition-all cursor-pointer" style={{
                    background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)',
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold" style={{ color: ACCENT }}>{cat.category}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
                        background: adequatePct > 80 ? 'rgba(74,222,128,0.15)' : adequatePct > 60 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                        color: adequatePct > 80 ? '#4ADE80' : adequatePct > 60 ? '#FBBF24' : '#F87171',
                      }}>{adequatePct}%</span>
                    </div>
                    <p className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{cat.total}</p>
                    <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border-light)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${adequatePct}%`,
                        background: adequatePct > 80 ? '#4ADE80' : adequatePct > 60 ? '#FBBF24' : '#EF4444',
                      }} />
                    </div>
                    <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: '#4ADE80' }}>{cat.adequate} OK</span>
                      <span style={{ color: '#FBBF24' }}>{cat.low} Low</span>
                      <span style={{ color: '#F87171' }}>{cat.critical} Crit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions - 1 col */}
          <div className="rounded-2xl p-3" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)',
          }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Dispense', icon: Pill, href: '/pharmacy', color: ACCENT },
                { label: 'Check Stock', icon: Search, href: '/pharmacy', color: '#60A5FA' },
                { label: 'Message', icon: Send, href: '/messages', color: '#EC4899' },
                { label: 'Inventory', icon: Package, href: '/pharmacy', color: '#4ADE80' },
              ].map(action => (
                <button key={action.label} onClick={() => router.push(action.href)}
                  className="flex items-center gap-2 p-2.5 rounded-lg transition-all"
                  style={{ background: `${action.color}08`, border: `1px solid ${action.color}15` }}>
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
