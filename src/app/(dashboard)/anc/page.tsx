'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { useANC } from '@/lib/hooks/useANC';
import { useApp } from '@/lib/context';
import {
  HeartPulse, Search, Plus, X, Users, AlertTriangle,
  Calendar, Activity, ChevronRight, ExternalLink,
} from 'lucide-react';

const RISK_FACTOR_OPTIONS = [
  'hypertension', 'anemia', 'previous_csection', 'multiple_pregnancy',
  'hiv_positive', 'rh_negative', 'primigravida', 'diabetes',
  'preeclampsia', 'bleeding', 'malaria_in_pregnancy', 'proteinuria',
];

const riskColors = {
  low: { color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)', label: 'Low Risk' },
  moderate: { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.12)', label: 'Moderate' },
  high: { color: 'var(--color-danger)', bg: 'rgba(229,46,66,0.12)', label: 'High Risk' },
};

export default function ANCPage() {
  const { currentUser } = useApp();
  const { visits, stats, loading, register } = useANC();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedMother, setSelectedMother] = useState<string | null>(null);

  const [form, setForm] = useState({
    motherId: '', motherName: '', motherAge: 25, gravida: 1, parity: 0,
    visitNumber: 1, visitDate: new Date().toISOString().slice(0, 10), gestationalAge: 12,
    bloodPressure: '', weight: 0, fundalHeight: 0, fetalHeartRate: 0,
    hemoglobin: 0, urineProtein: 'Negative', bloodGroup: 'O', rhFactor: '+',
    hivStatus: 'Not tested', malariaTest: 'Negative', syphilisTest: 'Non-reactive',
    ironFolateGiven: true, tetanusVaccine: false, iptpDose: 0,
    riskFactors: [] as string[], riskLevel: 'low' as 'low' | 'moderate' | 'high',
    birthPlanFacility: '', birthPlanTransport: '', birthPlanBloodDonor: '',
    nextVisitDate: '', notes: '',
  });

  // Group visits by mother — get latest visit for each
  const motherSummaries = useMemo(() => {
    const map = new Map<string, { latest: typeof visits[0]; visitCount: number; allVisits: typeof visits }>();
    for (const v of (visits || [])) {
      const existing = map.get(v.motherId);
      if (!existing) {
        map.set(v.motherId, { latest: v, visitCount: 1, allVisits: [v] });
      } else {
        existing.visitCount++;
        existing.allVisits.push(v);
        if (v.visitNumber > existing.latest.visitNumber) existing.latest = v;
      }
    }
    return Array.from(map.values());
  }, [visits]);

  const filteredMothers = useMemo(() => {
    let result = motherSummaries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.latest.motherName.toLowerCase().includes(q));
    }
    if (riskFilter !== 'all') {
      result = result.filter(m => m.latest.riskLevel === riskFilter);
    }
    return result;
  }, [motherSummaries, search, riskFilter]);

  const selectedMotherVisits = useMemo(() => {
    if (!selectedMother) return [];
    return (visits || []).filter(v => v.motherId === selectedMother).sort((a, b) => a.visitNumber - b.visitNumber);
  }, [visits, selectedMother]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      motherId: form.motherId || `mother-new-${Date.now()}`,
      motherName: form.motherName,
      motherAge: form.motherAge,
      gravida: form.gravida,
      parity: form.parity,
      visitNumber: form.visitNumber,
      visitDate: form.visitDate,
      gestationalAge: form.gestationalAge,
      facilityId: currentUser?.hospitalId || '',
      facilityName: currentUser?.hospitalName || '',
      state: currentUser?.hospital?.state || '',
      bloodPressure: form.bloodPressure,
      weight: form.weight,
      fundalHeight: form.fundalHeight,
      fetalHeartRate: form.fetalHeartRate,
      hemoglobin: form.hemoglobin,
      urineProtein: form.urineProtein,
      bloodGroup: form.bloodGroup,
      rhFactor: form.rhFactor,
      hivStatus: form.hivStatus,
      malariaTest: form.malariaTest,
      syphilisTest: form.syphilisTest,
      ironFolateGiven: form.ironFolateGiven,
      tetanusVaccine: form.tetanusVaccine,
      iptpDose: form.iptpDose,
      riskFactors: form.riskFactors,
      riskLevel: form.riskLevel,
      birthPlan: { facility: form.birthPlanFacility, transport: form.birthPlanTransport, bloodDonor: form.birthPlanBloodDonor },
      nextVisitDate: form.nextVisitDate,
      notes: form.notes,
      attendedBy: currentUser?.name || '',
      attendedByRole: currentUser?.role || 'doctor',
    });
    setShowModal(false);
  };

  if (loading) {
    return (
      <>
        <TopBar title="Antenatal Care" />
        <main className="page-container page-enter">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading ANC records...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Antenatal Care" />
      <main className="page-container page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Antenatal Care
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Maternal health monitoring · WHO 8-contact ANC model
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Register Visit
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="kpi-grid mb-6">
            {[
              { label: 'Mothers Enrolled', value: stats.totalMothers.toString(), color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)', icon: Users },
              { label: 'ANC4+ Rate', value: `${stats.anc4PlusRate}%`, color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)', icon: Activity },
              { label: 'High Risk', value: stats.highRiskCount.toString(), color: 'var(--color-danger)', bg: 'rgba(229,46,66,0.12)', icon: AlertTriangle },
              { label: 'This Month', value: stats.thisMonthVisits.toString(), color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)', icon: Calendar },
            ].map(stat => (
              <div key={stat.label} className="kpi">
                <div className="kpi__icon" style={{ background: stat.bg }}>
                  <stat.icon style={{ color: stat.color }} />
                </div>
                <div className="kpi__body">
                  <div className="kpi__value">{stat.value}</div>
                  <div className="kpi__label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              className="search-icon-input"
              placeholder="Search by mother name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mother List */}
          <div className="lg:col-span-2 card-elevated overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
              <HeartPulse className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Mothers Enrolled ({filteredMothers.length})
              </h3>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--table-row-border)' }}>
              {filteredMothers.map(({ latest, visitCount }) => {
                const risk = riskColors[latest.riskLevel] || riskColors.low;
                const isSelected = selectedMother === latest.motherId;
                const select = () => setSelectedMother(isSelected ? null : latest.motherId);
                return (
                  <div
                    key={latest.motherId}
                    role="button"
                    tabIndex={0}
                    onClick={select}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--table-row-hover)]"
                    style={{ background: isSelected ? 'var(--nav-active-bg)' : undefined }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--accent-primary)' }}>
                      {latest.motherName.split(' ').map(n => n?.[0] || '').join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{latest.motherName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Age {latest.motherAge} · G{latest.gravida}P{latest.parity} · {latest.gestationalAge} weeks · {latest.facilityName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: risk.bg, color: risk.color }}>
                        {risk.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {visitCount} visit{visitCount !== 1 ? 's' : ''}
                      </span>
                      <Link
                        href={`/patients/${latest.motherId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--accent-light)]"
                        style={{ color: 'var(--accent-primary)' }}
                        title="View patient record"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                );
              })}
              {filteredMothers.length === 0 && (
                <div className="p-8 text-center">
                  <HeartPulse className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No mothers found</p>
                </div>
              )}
            </div>
          </div>

          {/* Visit Detail Panel */}
          <div className="space-y-4">
            {selectedMother && selectedMotherVisits.length > 0 ? (
              <>
                {/* Mother Summary */}
                <div className="card-elevated p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <HeartPulse className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Visit History
                  </h3>
                  <div className="space-y-3">
                    {selectedMotherVisits.map(v => {
                      const risk = riskColors[v.riskLevel] || riskColors.low;
                      return (
                        <div key={v._id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ANC {v.visitNumber}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: risk.bg, color: risk.color }}>{risk.label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span>Date: {v.visitDate}</span>
                            <span>GA: {v.gestationalAge} wks</span>
                            <span>BP: {v.bloodPressure}</span>
                            <span>Wt: {v.weight} kg</span>
                            <span>Hb: {v.hemoglobin} g/dL</span>
                            <span>FHR: {v.fetalHeartRate} bpm</span>
                          </div>
                          {(v.riskFactors?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(v.riskFactors || []).map(rf => (
                                <span key={rf} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.1)', color: 'var(--color-danger)' }}>
                                  {rf.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {v.notes && (
                            <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{v.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Birth Plan */}
                {(() => {
                  const latest = selectedMotherVisits[selectedMotherVisits.length - 1];
                  return (
                    <div className="card-elevated p-4">
                      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Birth Plan</h3>
                      <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex justify-between">
                          <span>Delivery Facility</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{latest.birthPlan?.facility || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transport</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{latest.birthPlan?.transport || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blood Donor</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{latest.birthPlan?.bloodDonor || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Visit</span>
                          <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>{latest.nextVisitDate || '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="card-elevated p-8 text-center">
                <HeartPulse className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a mother to view visit history</p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="card-elevated p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn" style={{ margin: '20px' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Register ANC Visit</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-[var(--overlay-light)]">
                  <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mother Info */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>Mother Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label>Mother Name</label>
                      <input type="text" required value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} placeholder="Full name" />
                    </div>
                    <div>
                      <label>Age</label>
                      <input type="number" min={14} max={55} value={form.motherAge} onChange={e => setForm({ ...form, motherAge: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <label>Gravida</label>
                      <input type="number" min={1} max={20} value={form.gravida} onChange={e => setForm({ ...form, gravida: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label>Parity</label>
                      <input type="number" min={0} max={20} value={form.parity} onChange={e => setForm({ ...form, parity: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label>Visit #</label>
                      <input type="number" min={1} max={8} value={form.visitNumber} onChange={e => setForm({ ...form, visitNumber: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label>GA (weeks)</label>
                      <input type="number" min={4} max={44} value={form.gestationalAge} onChange={e => setForm({ ...form, gestationalAge: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>

                {/* Clinical Assessment */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>Clinical Assessment</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label>BP (mmHg)</label>
                      <input type="text" value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder="120/80" />
                    </div>
                    <div>
                      <label>Weight (kg)</label>
                      <input type="number" step="0.1" value={form.weight || ''} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label>Fundal Height</label>
                      <input type="number" value={form.fundalHeight || ''} onChange={e => setForm({ ...form, fundalHeight: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label>Fetal HR (bpm)</label>
                      <input type="number" value={form.fetalHeartRate || ''} onChange={e => setForm({ ...form, fetalHeartRate: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <label>Hemoglobin</label>
                      <input type="number" step="0.1" value={form.hemoglobin || ''} onChange={e => setForm({ ...form, hemoglobin: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label>Urine Protein</label>
                      <select value={form.urineProtein} onChange={e => setForm({ ...form, urineProtein: e.target.value })}>
                        <option>Negative</option><option>Trace</option><option>+</option><option>++</option><option>+++</option>
                      </select>
                    </div>
                    <div>
                      <label>Blood Group</label>
                      <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                        <option>O</option><option>A</option><option>B</option><option>AB</option>
                      </select>
                    </div>
                    <div>
                      <label>Rh Factor</label>
                      <select value={form.rhFactor} onChange={e => setForm({ ...form, rhFactor: e.target.value })}>
                        <option>+</option><option>-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lab & Interventions */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>Lab & Interventions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label>HIV Status</label>
                      <select value={form.hivStatus} onChange={e => setForm({ ...form, hivStatus: e.target.value })}>
                        <option>Not tested</option><option>Negative</option><option>Positive</option><option>Positive (on ART)</option>
                      </select>
                    </div>
                    <div>
                      <label>Malaria Test</label>
                      <select value={form.malariaTest} onChange={e => setForm({ ...form, malariaTest: e.target.value })}>
                        <option>Negative</option><option>Positive</option><option>Not tested</option>
                      </select>
                    </div>
                    <div>
                      <label>Syphilis Test</label>
                      <select value={form.syphilisTest} onChange={e => setForm({ ...form, syphilisTest: e.target.value })}>
                        <option>Non-reactive</option><option>Reactive</option><option>Not tested</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer" style={{ textTransform: 'none', fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={form.ironFolateGiven} onChange={e => setForm({ ...form, ironFolateGiven: e.target.checked })} className="w-4 h-4" />
                      Iron/Folate given
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" style={{ textTransform: 'none', fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={form.tetanusVaccine} onChange={e => setForm({ ...form, tetanusVaccine: e.target.checked })} className="w-4 h-4" />
                      Tetanus vaccine
                    </label>
                    <div className="flex items-center gap-2">
                      <label style={{ textTransform: 'none', fontSize: '0.875rem', marginBottom: 0 }}>IPTp Dose:</label>
                      <input type="number" min={0} max={5} value={form.iptpDose} onChange={e => setForm({ ...form, iptpDose: parseInt(e.target.value) })} style={{ width: '60px' }} />
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>Risk Assessment</p>
                  <div className="mb-3">
                    <label>Risk Level</label>
                    <select value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value as 'low' | 'moderate' | 'high' })}>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <label>Risk Factors</label>
                  <div className="flex flex-wrap gap-2">
                    {RISK_FACTOR_OPTIONS.map(rf => (
                      <button
                        key={rf}
                        type="button"
                        onClick={() => {
                          const has = form.riskFactors.includes(rf);
                          setForm({ ...form, riskFactors: has ? form.riskFactors.filter(r => r !== rf) : [...form.riskFactors, rf] });
                        }}
                        className="text-xs px-2 py-1 rounded-full border transition-colors"
                        style={{
                          borderColor: form.riskFactors.includes(rf) ? 'var(--color-danger)' : 'var(--border-light)',
                          background: form.riskFactors.includes(rf) ? 'rgba(229,46,66,0.12)' : 'transparent',
                          color: form.riskFactors.includes(rf) ? 'var(--color-danger)' : 'var(--text-muted)',
                        }}
                      >
                        {rf.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates & Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Visit Date</label>
                    <input type="date" required value={form.visitDate} onChange={e => setForm({ ...form, visitDate: e.target.value })} />
                  </div>
                  <div>
                    <label>Next Visit Date</label>
                    <input type="date" value={form.nextVisitDate} onChange={e => setForm({ ...form, nextVisitDate: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label>Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinical notes..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1">
                    <HeartPulse className="w-4 h-4" /> Register Visit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
