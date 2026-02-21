'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import {
  Users, Home, Activity, Clock, CheckCircle2,
  Eye, Syringe,
  FileText, Flag, Search,
} from 'lucide-react';
import type { BomaVisitDoc } from '@/lib/db-types';
import type { BHWPerformance } from '@/lib/services/boma-visit-service';
import type { ImmunizationDefaulter } from '@/lib/services/immunization-service';

const ACCENT = '#D97706';

export default function PayamSupervisorDashboard() {
  const { currentUser } = useApp();

  const [bhwPerformance, setBhwPerformance] = useState<BHWPerformance[]>([]);
  const [reviewQueue, setReviewQueue] = useState<BomaVisitDoc[]>([]);
  const [defaulters, setDefaulters] = useState<ImmunizationDefaulter[]>([]);
  const [reviewStats, setReviewStats] = useState({ pending: 0, reviewed: 0, flagged: 0, total: 0 });
  const [defaulterStats, setDefaulterStats] = useState({ totalDefaulters: 0, uniqueChildren: 0, critical: 0, high: 0, medium: 0, byVaccine: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'defaulters'>('overview');
  const [searchQ, setSearchQ] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { getBHWPerformance, getVisitsForReview, getReviewStats } = await import('@/lib/services/boma-visit-service');
      const { getDefaulters, getDefaulterStats } = await import('@/lib/services/immunization-service');

      const [perf, queue, rStats, defs, dStats] = await Promise.all([
        getBHWPerformance(),
        getVisitsForReview(),
        getReviewStats(),
        getDefaulters(),
        getDefaulterStats(),
      ]);

      setBhwPerformance(perf);
      setReviewQueue(queue);
      setReviewStats(rStats);
      setDefaulters(defs);
      setDefaulterStats(dStats);
    } catch (err) {
      console.error('Failed to load payam data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReview = useCallback(async (visitId: string, status: 'reviewed' | 'flagged') => {
    if (!currentUser) return;
    const { reviewVisit } = await import('@/lib/services/boma-visit-service');
    await reviewVisit(visitId, currentUser._id, currentUser.name, status, reviewNotes);
    setReviewingId(null);
    setReviewNotes('');
    loadData();
  }, [currentUser, reviewNotes, loadData]);

  if (!currentUser) return null;

  const displayName = currentUser.name.split(' ').pop() || currentUser.name;
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening';

  const activeBHWs = bhwPerformance.filter(b => b.isActive).length;
  const totalBHWs = bhwPerformance.length;

  const filteredQueue = reviewQueue.filter(v =>
    !searchQ || v.patientName.toLowerCase().includes(searchQ.toLowerCase()) ||
    v.workerName.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <>
      <TopBar title="Payam Supervisor" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: ACCENT }}>
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {greeting}, {displayName}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Payam Supervisor · Kajo-keji
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Active BHWs', value: `${activeBHWs}/${totalBHWs}`, icon: Users, accent: '#059669' },
            { label: 'Pending Reviews', value: reviewStats.pending.toString(), icon: FileText, accent: '#D97706' },
            { label: 'Flagged', value: reviewStats.flagged.toString(), icon: Flag, accent: '#EF4444' },
            { label: 'Defaulters', value: defaulterStats.uniqueChildren.toString(), icon: Syringe, accent: '#8B5CF6' },
            { label: 'Total Visits', value: reviewStats.total.toString(), icon: Activity, accent: '#3B82F6' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => {
                const tabMap: Record<string, 'overview' | 'review' | 'defaulters'> = { 'Active BHWs': 'overview', 'Pending Reviews': 'review', 'Flagged': 'review', 'Defaulters': 'defaulters' };
                if (tabMap[kpi.label]) setActiveTab(tabMap[kpi.label]);
              }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: kpi.accent }} />
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3 h-3" style={{ color: kpi.accent }} />
                <span className="text-[9px] uppercase font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{loading ? '—' : kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--overlay-subtle)' }}>
          {[
            { id: 'overview' as const, label: 'BHW Performance', icon: Users },
            { id: 'review' as const, label: `Review Queue (${reviewStats.pending})`, icon: Eye },
            { id: 'defaulters' as const, label: `Defaulter Tracker (${defaulterStats.uniqueChildren})`, icon: Syringe },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.id ? ACCENT : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? 'var(--card-shadow)' : 'none',
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: BHW PERFORMANCE OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {bhwPerformance.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No BHW data available yet</p>
              </div>
            )}
            {bhwPerformance.map(bhw => {
              const daysSinceActive = bhw.lastActiveDate ? Math.floor((Date.now() - new Date(bhw.lastActiveDate).getTime()) / 86400000) : 0;
              return (
                <div key={bhw.workerId} className="rounded-2xl overflow-hidden" style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${bhw.isActive ? 'var(--border-light)' : 'rgba(239,68,68,0.2)'}`,
                  boxShadow: 'var(--card-shadow)',
                }}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: bhw.isActive ? '#059669' : '#94A3B8' }}>
                          {bhw.workerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{bhw.workerName}</p>
                          <div className="flex items-center gap-2">
                            <Home className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Boma: {bhw.boma}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{
                          background: bhw.isActive ? '#05966915' : '#EF444415',
                          color: bhw.isActive ? '#059669' : '#EF4444',
                        }}>
                          {bhw.isActive ? 'ACTIVE' : `INACTIVE ${daysSinceActive}d`}
                        </span>
                      </div>
                    </div>

                    {/* Performance metrics */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: 'This Week', value: bhw.thisWeekVisits, color: '#3B82F6' },
                        { label: 'Total Visits', value: bhw.totalVisits, color: '#059669' },
                        { label: 'Treated', value: bhw.treated, color: '#10B981' },
                        { label: 'Referred', value: bhw.referred, color: '#F59E0B' },
                        { label: 'Follow-Up %', value: `${bhw.followUpCompletionRate}%`, color: bhw.followUpCompletionRate >= 80 ? '#059669' : '#EF4444' },
                      ].map(metric => (
                        <div key={metric.label} className="p-2 rounded-lg text-center" style={{ background: 'var(--overlay-subtle)' }}>
                          <p className="text-base font-bold" style={{ color: metric.color }}>{metric.value}</p>
                          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{metric.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Referral rate bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Referral Rate:</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--overlay-subtle)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${bhw.referralRate}%`,
                          background: bhw.referralRate > 40 ? '#EF4444' : bhw.referralRate > 20 ? '#F59E0B' : '#059669',
                        }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{bhw.referralRate}%</span>
                    </div>

                    {bhw.pendingReviews > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" style={{ color: ACCENT }} />
                        <span className="text-[10px] font-medium" style={{ color: ACCENT }}>
                          {bhw.pendingReviews} visits pending review
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TAB: REVIEW QUEUE (Remote Patient Review) ═══ */}
        {activeTab === 'review' && (
          <div>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by patient or BHW name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>

            {filteredQueue.length === 0 && !loading && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#059669', opacity: 0.3 }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All visits reviewed!</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredQueue.map(visit => (
                <div key={visit._id} className="rounded-2xl overflow-hidden" style={{
                  background: 'var(--bg-card)',
                  border: reviewingId === visit._id ? `2px solid ${ACCENT}` : '1px solid var(--border-light)',
                  boxShadow: 'var(--card-shadow)',
                }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: visit.action === 'treated' ? '#059669' : '#EF4444' }}>
                          {visit.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{visit.patientName}</p>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{visit.geocodeId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                          background: visit.action === 'treated' ? '#05966915' : '#EF444415',
                          color: visit.action === 'treated' ? '#059669' : '#EF4444',
                        }}>{visit.action.toUpperCase()}</span>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(visit.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Complaint</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{visit.chiefComplaint}</p>
                      </div>
                      <div className="p-1.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Condition</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{visit.suspectedCondition}</p>
                      </div>
                      <div className="p-1.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>BHW</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{visit.workerName}</p>
                      </div>
                    </div>

                    {visit.treatmentGiven && (
                      <p className="text-xs mb-2 p-1.5 rounded-lg" style={{ background: '#05966908', color: '#059669' }}>
                        Treatment: {visit.treatmentGiven}
                      </p>
                    )}
                    {visit.referredTo && (
                      <p className="text-xs mb-2 p-1.5 rounded-lg" style={{ background: '#EF444408', color: '#EF4444' }}>
                        Referred to: {visit.referredTo}
                      </p>
                    )}

                    {/* Review actions */}
                    {reviewingId === visit._id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Add review notes (optional)..."
                          className="w-full px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '60px' }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(visit._id, 'reviewed')}
                            className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5"
                            style={{ background: '#059669' }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReview(visit._id, 'flagged')}
                            className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5"
                            style={{ background: '#EF4444' }}
                          >
                            <Flag className="w-3.5 h-3.5" /> Flag for Review
                          </button>
                          <button
                            onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                            className="px-3 py-2.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--overlay-subtle)', color: 'var(--text-muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(visit._id)}
                        className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 mt-1"
                        style={{ background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}20` }}
                      >
                        <Eye className="w-3.5 h-3.5" /> Review This Visit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB: IMMUNIZATION DEFAULTER TRACKER ═══ */}
        {activeTab === 'defaulters' && (
          <div>
            {/* Defaulter stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Overdue', value: defaulterStats.totalDefaulters, color: '#EF4444' },
                { label: 'Children', value: defaulterStats.uniqueChildren, color: '#8B5CF6' },
                { label: 'Critical (>30d)', value: defaulterStats.critical, color: '#DC2626' },
                { label: 'High (>14d)', value: defaulterStats.high, color: '#F59E0B' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-3" style={{
                  background: `${stat.color}08`,
                  border: `1px solid ${stat.color}15`,
                }}>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{loading ? '—' : stat.value}</p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* By vaccine breakdown */}
            {Object.keys(defaulterStats.byVaccine).length > 0 && (
              <div className="rounded-2xl p-3 mb-4" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
              }}>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Overdue by Vaccine</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(defaulterStats.byVaccine).map(([vaccine, count]) => (
                    <span key={vaccine} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{
                      background: '#8B5CF615',
                      color: '#8B5CF6',
                      border: '1px solid #8B5CF620',
                    }}>
                      {vaccine}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Defaulter list */}
            {defaulters.length === 0 && !loading && (
              <div className="text-center py-12">
                <Syringe className="w-12 h-12 mx-auto mb-3" style={{ color: '#059669', opacity: 0.3 }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No immunization defaulters!</p>
              </div>
            )}

            <div className="space-y-2">
              {defaulters.map((d, i) => (
                <div key={`${d.patientId}-${d.vaccine}-${i}`} className="rounded-2xl p-3" style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${d.urgency === 'critical' ? 'rgba(239,68,68,0.3)' : d.urgency === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--border-light)'}`,
                  boxShadow: 'var(--card-shadow)',
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          background: d.urgency === 'critical' ? '#EF4444' : d.urgency === 'high' ? '#F59E0B' : '#8B5CF6',
                        }}>
                        {d.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.patientName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {d.gender} · {d.ageMonths} months · {d.facilityName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                        background: d.urgency === 'critical' ? '#EF444415' : d.urgency === 'high' ? '#F59E0B15' : '#8B5CF615',
                        color: d.urgency === 'critical' ? '#EF4444' : d.urgency === 'high' ? '#F59E0B' : '#8B5CF6',
                      }}>
                        {d.daysOverdue} DAYS OVERDUE
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#8B5CF610' }}>
                      <Syringe className="w-3 h-3" style={{ color: '#8B5CF6' }} />
                      <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>
                        {d.vaccine} Dose {d.doseNumber}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Due: {new Date(d.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {d.lastVaccineDate && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Last: {new Date(d.lastVaccineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
