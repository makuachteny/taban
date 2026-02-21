'use client';

import TopBar from '@/components/TopBar';
import { useVitalStatistics } from '@/lib/hooks/useVitalStatistics';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useDataQuality } from '@/lib/hooks/useDataQuality';
import { useFacilityAssessments } from '@/lib/hooks/useFacilityAssessments';
import { Globe, Baby, Skull, Activity, Heart, Shield } from 'lucide-react';

export default function PublicStatsPage() {
  const { data: vitalData, loading: vLoading } = useVitalStatistics();
  const { hospitals } = useHospitals();
  const { data: dqData, loading: dqLoading } = useDataQuality();
  const { summary: assessmentSummary } = useFacilityAssessments();

  const loading = vLoading || dqLoading;

  if (loading || !vitalData) return <><TopBar title="Public Statistics" /><main className="flex-1 p-6 flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading public statistics...</p></main></>;

  const { birthStats, deathStats } = vitalData;
  const totalPop = hospitals.reduce((s, h) => s + h.patientCount, 0);
  const totalBeds = hospitals.reduce((s, h) => s + h.totalBeds, 0);
  const totalStaff = hospitals.reduce((s, h) => s + h.doctors + h.nurses + h.clinicalOfficers, 0);

  const scoreColor = (score: number) => score >= 70 ? '#2B6FE0' : score >= 50 ? '#FCD34D' : '#E52E42';

  return (
    <>
      <TopBar title="Public Statistics" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Globe className="w-6 h-6" style={{ color: '#2B6FE0' }} />
            <h1 className="text-xl font-semibold">Public Health Statistics</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Republic of South Sudan — National Health Indicators Portal</p>
        </div>

        {/* National Overview */}
        <div className="card-elevated p-5 mb-6" style={{ background: 'rgba(43,111,224,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" style={{ color: '#2B6FE0' }} />
            <h2 className="font-semibold text-sm">National Health System Overview</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Health Facilities</p>
              <p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{hospitals.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Patients</p>
              <p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{totalPop.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Hospital Beds</p>
              <p className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{totalBeds.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Health Workers</p>
              <p className="text-2xl font-bold" style={{ color: '#38BDF8' }}>{totalStaff.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>DHIS2 Coverage</p>
              <p className="text-2xl font-bold" style={{ color: scoreColor(dqData?.dhis2Adoption ?? 0) }}>{dqData?.dhis2Adoption ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* CRVS - Births */}
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-4">
              <Baby className="w-5 h-5" style={{ color: '#2B6FE0' }} />
              <h2 className="font-semibold text-sm">Birth Registration (CRVS)</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(43,111,224,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Births Registered</p>
                <p className="text-xl font-bold" style={{ color: '#2B6FE0' }}>{birthStats.total}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(43,111,224,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This Month</p>
                <p className="text-xl font-bold" style={{ color: '#2B6FE0' }}>{birthStats.thisMonth}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Male births</span>
                <span className="font-bold" style={{ color: '#2B6FE0' }}>{birthStats.byGender.male}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Female births</span>
                <span className="font-bold" style={{ color: '#E52E42' }}>{birthStats.byGender.female}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Caesarean rate</span>
                <span className="font-bold">{birthStats.total ? Math.round(birthStats.byDeliveryType.caesarean / birthStats.total * 100) : 0}%</span>
              </div>
            </div>
            {Object.keys(birthStats.byState).length > 0 && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Births by State</p>
                <div className="space-y-1.5">
                  {Object.entries(birthStats.byState).sort(([, a], [, b]) => b - a).map(([state, count]) => (
                    <div key={state} className="flex items-center gap-2">
                      <span className="text-[10px] w-36 truncate" style={{ color: 'var(--text-muted)' }}>{state}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                        <div className="h-full rounded-full" style={{ width: `${birthStats.total ? (count / birthStats.total) * 100 : 0}%`, background: '#2B6FE0' }} />
                      </div>
                      <span className="text-[10px] font-bold w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CRVS - Deaths */}
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-4">
              <Skull className="w-5 h-5" style={{ color: '#E52E42' }} />
              <h2 className="font-semibold text-sm">Mortality Statistics (CRVS)</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(229,46,66,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Deaths</p>
                <p className="text-xl font-bold" style={{ color: '#E52E42' }}>{deathStats.total}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(43,111,224,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ICD-11 Coded</p>
                <p className="text-xl font-bold" style={{ color: '#2B6FE0' }}>{deathStats.total ? Math.round(deathStats.withICD11Code / deathStats.total * 100) : 0}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Maternal deaths</span>
                <span className="font-bold" style={{ color: '#E52E42' }}>{deathStats.maternalDeaths}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Under-5 deaths</span>
                <span className="font-bold" style={{ color: '#FCD34D' }}>{deathStats.under5Deaths}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Neonatal deaths</span>
                <span className="font-bold" style={{ color: '#FCD34D' }}>{deathStats.neonatalDeaths}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Death notification rate</span>
                <span className="font-bold" style={{ color: scoreColor(deathStats.total ? Math.round(deathStats.notified / deathStats.total * 100) : 0) }}>
                  {deathStats.total ? Math.round(deathStats.notified / deathStats.total * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Death registration rate</span>
                <span className="font-bold" style={{ color: scoreColor(deathStats.total ? Math.round(deathStats.registered / deathStats.total * 100) : 0) }}>
                  {deathStats.total ? Math.round(deathStats.registered / deathStats.total * 100) : 0}%
                </span>
              </div>
            </div>
            {deathStats.topCauses.length > 0 && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Top Causes of Death</p>
                <div className="space-y-1.5">
                  {deathStats.topCauses.slice(0, 5).map((c, i) => (
                    <div key={c.code} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{c.code}</span>
                      <span className="text-[10px] flex-1 truncate">{c.cause}</span>
                      <span className="text-xs font-bold">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health System Readiness */}
        {assessmentSummary && (
          <div className="card-elevated p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" style={{ color: '#2B6FE0' }} />
              <h2 className="font-semibold text-sm">Health System Readiness</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(43,111,224,0.12)', color: '#2B6FE0' }}>{assessmentSummary.facilitiesAssessed} facilities assessed</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                {[
                  { label: 'General Equipment', score: assessmentSummary.avgEquipmentScore },
                  { label: 'Diagnostic Capacity', score: assessmentSummary.avgDiagnosticScore },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span className="font-bold" style={{ color: scoreColor(item.score) }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                      <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Essential Medicines', score: assessmentSummary.avgMedicinesScore },
                  { label: 'Staffing Adequacy', score: assessmentSummary.avgStaffingScore },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span className="font-bold" style={{ color: scoreColor(item.score) }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                      <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Data Quality', score: assessmentSummary.avgDataQuality },
                  { label: 'Reporting Completeness', score: assessmentSummary.avgReportingCompleteness },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span className="font-bold" style={{ color: scoreColor(item.score) }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                      <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Quality Summary */}
        {dqData && (
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5" style={{ color: '#E52E42' }} />
              <h2 className="font-semibold text-sm">Data Quality Indicators</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--overlay-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completeness</p>
                <p className="text-xl font-bold" style={{ color: scoreColor(dqData.avgCompleteness) }}>{dqData.avgCompleteness}%</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--overlay-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Timeliness</p>
                <p className="text-xl font-bold" style={{ color: scoreColor(dqData.avgTimeliness) }}>{dqData.avgTimeliness}%</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--overlay-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accuracy</p>
                <p className="text-xl font-bold" style={{ color: scoreColor(dqData.avgQuality) }}>{dqData.avgQuality}%</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--overlay-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>HIS Workforce</p>
                <p className="text-xl font-bold" style={{ color: '#2B6FE0' }}>{dqData.totalHISStaff}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
