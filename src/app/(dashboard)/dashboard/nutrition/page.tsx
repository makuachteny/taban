'use client';

import { useMemo } from 'react';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePatients } from '@/lib/hooks/usePatients';
import {
  AlertTriangle, CheckCircle2, TrendingDown,
  Baby, HeartPulse, BarChart3, Activity, Scale,
  Utensils, Droplets,
} from 'lucide-react';

const ACCENT = '#EA580C';

const MUAC_THRESHOLDS = { severe: 11.5, moderate: 12.5, normal: 13.5 };

const SAMPLE_SCREENINGS = [
  { id: 'ns-001', name: 'Akech Deng Mawien', age: '2y', sex: 'F', muac: 10.8, weight: 8.2, height: 78, edema: true, status: 'SAM', date: '2026-02-09' },
  { id: 'ns-002', name: 'Tut Chuol Both', age: '3y', sex: 'M', muac: 12.0, weight: 10.5, height: 88, edema: false, status: 'MAM', date: '2026-02-09' },
  { id: 'ns-003', name: 'Nyabol Koang Jal', age: '28w ANC', sex: 'F', muac: 21.5, weight: 52, height: 158, edema: false, status: 'Normal', date: '2026-02-09' },
  { id: 'ns-004', name: 'Deng Garang Majok', age: '18m', sex: 'M', muac: 11.2, weight: 7.1, height: 72, edema: false, status: 'SAM', date: '2026-02-08' },
  { id: 'ns-005', name: 'Achol Dut Machar', age: '4y', sex: 'F', muac: 13.0, weight: 13.8, height: 98, edema: false, status: 'At Risk', date: '2026-02-08' },
  { id: 'ns-006', name: 'Ajak Mading Kuol', age: '24w ANC', sex: 'F', muac: 19.8, weight: 48, height: 155, edema: false, status: 'Underweight', date: '2026-02-08' },
  { id: 'ns-007', name: 'Gatluak Puok Riek', age: '5y', sex: 'M', muac: 14.2, weight: 17, height: 108, edema: false, status: 'Normal', date: '2026-02-07' },
  { id: 'ns-008', name: 'Nyamal Gatdet Both', age: '11m', sex: 'F', muac: 12.3, weight: 6.8, height: 68, edema: false, status: 'MAM', date: '2026-02-07' },
];

const SUPPLY_ITEMS = [
  { name: 'RUTF (Plumpy\'Nut)', stock: 120, unit: 'sachets', threshold: 50, status: 'ok' },
  { name: 'F-75 Therapeutic Milk', stock: 8, unit: 'tins', threshold: 15, status: 'low' },
  { name: 'F-100 Therapeutic Milk', stock: 22, unit: 'tins', threshold: 10, status: 'ok' },
  { name: 'ReSoMal (ORS)', stock: 3, unit: 'packets', threshold: 10, status: 'critical' },
  { name: 'Vitamin A Capsules', stock: 200, unit: 'capsules', threshold: 50, status: 'ok' },
  { name: 'Iron/Folate Tabs', stock: 150, unit: 'tabs', threshold: 30, status: 'ok' },
  { name: 'MUAC Tapes', stock: 5, unit: 'tapes', threshold: 10, status: 'low' },
  { name: 'Weighing Scale', stock: 2, unit: 'units', threshold: 1, status: 'ok' },
];

export default function NutritionDashboard() {
  const { currentUser } = useApp();
  usePatients();

  const stats = useMemo(() => {
    const screenings = SAMPLE_SCREENINGS;
    return {
      total: screenings.length,
      sam: screenings.filter(s => s.status === 'SAM').length,
      mam: screenings.filter(s => s.status === 'MAM').length,
      atRisk: screenings.filter(s => s.status === 'At Risk' || s.status === 'Underweight').length,
      normal: screenings.filter(s => s.status === 'Normal').length,
      children: screenings.filter(s => !s.age.includes('ANC')).length,
      anc: screenings.filter(s => s.age.includes('ANC')).length,
      criticalSupply: SUPPLY_ITEMS.filter(s => s.status === 'critical').length,
    };
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'SAM') return '#DC2626';
    if (status === 'MAM') return '#D97706';
    if (status === 'At Risk' || status === 'Underweight') return '#F59E0B';
    return '#059669';
  };

  if (!currentUser) return null;

  return (
    <>
      <TopBar title="Nutrition Dashboard" />
      <main className="page-container page-enter">

        {/* KPI strip */}
        <div className="kpi-grid mb-4">
          {[
            { label: 'Screenings', value: stats.total, icon: Scale, color: ACCENT },
            { label: 'SAM Cases', value: stats.sam, icon: AlertTriangle, color: '#DC2626' },
            { label: 'MAM Cases', value: stats.mam, icon: TrendingDown, color: '#D97706' },
            { label: 'At Risk', value: stats.atRisk, icon: Activity, color: '#F59E0B' },
            { label: 'Normal', value: stats.normal, icon: CheckCircle2, color: '#059669' },
            { label: 'Children <5', value: stats.children, icon: Baby, color: 'var(--accent-primary)' },
            { label: 'ANC Mothers', value: stats.anc, icon: HeartPulse, color: '#EC4899' },
            { label: 'Supply Alerts', value: stats.criticalSupply, icon: Droplets, color: stats.criticalSupply > 0 ? '#DC2626' : '#059669' },
          ].map(k => (
            <div key={k.label} className="kpi">
              <div className="kpi__icon" style={{ background: `${k.color}15` }}><k.icon style={{ color: k.color }} /></div>
              <div className="kpi__body">
                <div className="kpi__value">{k.value}</div>
                <div className="kpi__label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Screening list */}
          <div className="lg:col-span-2 glass-section">
            <div className="glass-section-header">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nutrition Screenings</span>
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{stats.total} total</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age/Type</th>
                    <th>MUAC (cm)</th>
                    <th>Weight (kg)</th>
                    <th>Height (cm)</th>
                    <th>Edema</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SCREENINGS.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(s.status) }} />
                          <span className="text-xs font-semibold">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-xs">{s.age} &middot; {s.sex}</td>
                      <td>
                        <span className="text-xs font-bold" style={{ color: s.muac < MUAC_THRESHOLDS.severe ? '#DC2626' : s.muac < MUAC_THRESHOLDS.moderate ? '#D97706' : 'var(--text-primary)' }}>
                          {s.muac}
                        </span>
                      </td>
                      <td className="text-xs">{s.weight}</td>
                      <td className="text-xs">{s.height}</td>
                      <td>{s.edema ? <span className="text-[10px] font-bold" style={{ color: '#DC2626' }}>Yes</span> : <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No</span>}</td>
                      <td>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${getStatusColor(s.status)}15`, color: getStatusColor(s.status) }}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">

            {/* MUAC classification */}
            <div className="glass-section">
              <div className="glass-section-header">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Classification</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Severe Acute Malnutrition (SAM)', count: stats.sam, color: '#DC2626', desc: 'MUAC < 11.5cm or edema' },
                  { label: 'Moderate Acute Malnutrition (MAM)', count: stats.mam, color: '#D97706', desc: 'MUAC 11.5 - 12.5cm' },
                  { label: 'At Risk / Underweight', count: stats.atRisk, color: '#F59E0B', desc: 'MUAC 12.5 - 13.5cm' },
                  { label: 'Normal', count: stats.normal, color: '#059669', desc: 'MUAC > 13.5cm' },
                ].map(item => {
                  const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-medium)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supply status */}
            <div className="glass-section">
              <div className="glass-section-header">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4" style={{ color: '#059669' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nutrition Supplies</span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {SUPPLY_ITEMS.map(item => (
                  <div key={item.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2">
                      {item.status === 'critical' ? <AlertTriangle className="w-3 h-3" style={{ color: '#DC2626' }} /> :
                       item.status === 'low' ? <TrendingDown className="w-3 h-3" style={{ color: '#D97706' }} /> :
                       <CheckCircle2 className="w-3 h-3" style={{ color: '#059669' }} />}
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{
                      color: item.status === 'critical' ? '#DC2626' : item.status === 'low' ? '#D97706' : 'var(--text-primary)',
                    }}>{item.stock} {item.unit}</span>
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
