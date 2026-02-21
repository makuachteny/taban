'use client';

import TopBar from '@/components/TopBar';
import { useVitalStatistics } from '@/lib/hooks/useVitalStatistics';
import { Baby, Skull, AlertTriangle, Activity } from 'lucide-react';

export default function VitalStatisticsPage() {
  const { data, loading } = useVitalStatistics();

  if (loading || !data) return <><TopBar title="Vital Statistics" /><main className="flex-1 p-6 flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading vital statistics...</p></main></>;

  const { birthStats, deathStats } = data;

  return (
    <>
      <TopBar title="Vital Statistics" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-6 h-6" style={{ color: '#2B6FE0' }} />
            <h1 className="text-xl font-semibold">National Vital Statistics</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Civil Registration and Vital Statistics (CRVS) — Republic of South Sudan</p>
        </div>

        {/* Birth Statistics */}
        <h2 className="font-semibold text-sm flex items-center gap-2 mb-3"><Baby className="w-4 h-4" style={{ color: '#2B6FE0' }} /> Birth Statistics</h2>
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Births</p><p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{birthStats.total}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>This Month</p><p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{birthStats.thisMonth}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Male Births</p><p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{birthStats.byGender.male}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Female Births</p><p className="text-2xl font-bold" style={{ color: '#E52E42' }}>{birthStats.byGender.female}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Caesarean Rate</p><p className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{birthStats.total ? Math.round(birthStats.byDeliveryType.caesarean / birthStats.total * 100) : 0}%</p></div>
        </div>

        {/* Births by State */}
        {Object.keys(birthStats.byState).length > 0 && (
          <div className="card-elevated p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3">Births by State</h3>
            <div className="space-y-2">
              {Object.entries(birthStats.byState).sort(([, a], [, b]) => b - a).map(([state, count]) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs w-48 truncate" style={{ color: 'var(--text-secondary)' }}>{state}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                    <div className="h-full rounded-full" style={{ width: `${birthStats.total > 0 ? (count / birthStats.total) * 100 : 0}%`, background: '#2B6FE0' }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Death Statistics */}
        <h2 className="font-semibold text-sm flex items-center gap-2 mb-3 mt-6"><Skull className="w-4 h-4" style={{ color: '#E52E42' }} /> Mortality Statistics</h2>
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Deaths</p><p className="text-2xl font-bold" style={{ color: '#E52E42' }}>{deathStats.total}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Maternal Deaths</p><p className="text-2xl font-bold" style={{ color: '#E52E42' }}>{deathStats.maternalDeaths}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Under-5 Deaths</p><p className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{deathStats.under5Deaths}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Neonatal Deaths</p><p className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{deathStats.neonatalDeaths}</p></div>
          <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>ICD-11 Coded</p><p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{deathStats.total ? Math.round(deathStats.withICD11Code / deathStats.total * 100) : 0}%</p></div>
        </div>

        {/* CRVS Indicators */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card-elevated p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" style={{ color: '#E52E42' }} /> CRVS Registration Gaps</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--text-secondary)' }}>Death Notification Rate</span><span className="font-bold">{deathStats.total ? Math.round(deathStats.notified / deathStats.total * 100) : 0}%</span></div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}><div className="h-full rounded-full" style={{ width: `${deathStats.total ? (deathStats.notified / deathStats.total) * 100 : 0}%`, background: '#FCD34D' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--text-secondary)' }}>Death Registration Rate</span><span className="font-bold">{deathStats.total ? Math.round(deathStats.registered / deathStats.total * 100) : 0}%</span></div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}><div className="h-full rounded-full" style={{ width: `${deathStats.total ? (deathStats.registered / deathStats.total) * 100 : 0}%`, background: '#E52E42' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--text-secondary)' }}>ICD-11 Coding Rate</span><span className="font-bold">{deathStats.total ? Math.round(deathStats.withICD11Code / deathStats.total * 100) : 0}%</span></div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}><div className="h-full rounded-full" style={{ width: `${deathStats.total ? (deathStats.withICD11Code / deathStats.total) * 100 : 0}%`, background: '#2B6FE0' }} /></div>
              </div>
            </div>
          </div>

          <div className="card-elevated p-4">
            <h3 className="font-semibold text-sm mb-3">Top Causes of Death</h3>
            <div className="space-y-2">
              {deathStats.topCauses.slice(0, 5).map((c, i) => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{c.code}</span>
                  <span className="text-xs flex-1 truncate">{c.cause}</span>
                  <span className="text-sm font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
