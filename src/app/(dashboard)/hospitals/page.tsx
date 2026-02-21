'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import {
  Building2, BedDouble, Users, Stethoscope, WifiOff,
  Zap, ZapOff, Sun, Truck, Signal, Clock, Activity,
  MapPin, HeartPulse, X, Search, Filter, ChevronDown,
  RefreshCw, FlaskConical, Download, Eye,
  Syringe, Baby, Pill, ShieldCheck, Microscope,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useApp } from '@/lib/context';
import type { HospitalDoc } from '@/lib/db-types';
import {
  getPerformanceColor, getPerformanceBg, getMetricColorInterpolated,
  METRIC_LABELS, type PerformanceMetricKey,
} from '@/lib/performance-colors';
import { states, statesAndCounties } from '@/data/mock';

// ───────────────────────────── helpers ─────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  national_referral: 'National Referral',
  state_hospital: 'State Hospital',
  county_hospital: 'County Hospital',
  phcc: 'PHCC',
  phcu: 'PHCU',
};

const TYPE_SHORT: Record<string, string> = {
  national_referral: 'NR',
  state_hospital: 'SH',
  county_hospital: 'CH',
  phcc: 'PHCC',
  phcu: 'PHCU',
};

const OWNERSHIP_LABELS: Record<string, string> = {
  public: 'Public',
  ngo: 'NGO',
  private: 'Private',
  faith_based: 'Faith-Based',
};

const STATUS_LABELS: Record<string, string> = {
  functional: 'Functional',
  partially_functional: 'Partial',
  non_functional: 'Non-Functional',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  functional: '#2B6FE0',
  partially_functional: '#F59E0B',
  non_functional: '#EF4444',
  closed: '#94A3B8',
};

const METRIC_KEYS: PerformanceMetricKey[] = [
  'reportingCompleteness', 'serviceReadinessScore', 'tracerMedicineAvailability',
  'staffingScore', 'ancCoverage', 'immunizationCoverage', 'qualityScore',
  'stockOutDays', 'opdVisitsPerMonth',
];

const PERCENTAGE_METRICS: PerformanceMetricKey[] = [
  'reportingCompleteness', 'serviceReadinessScore', 'tracerMedicineAvailability',
  'staffingScore', 'ancCoverage', 'immunizationCoverage', 'qualityScore',
];

const SERVICE_FLAG_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  epi: { icon: Syringe, label: 'EPI' },
  anc: { icon: Baby, label: 'ANC' },
  delivery: { icon: HeartPulse, label: 'Delivery' },
  hiv: { icon: ShieldCheck, label: 'HIV' },
  tb: { icon: Activity, label: 'TB' },
  emergencySurgery: { icon: FlaskConical, label: 'Surgery' },
  laboratory: { icon: Microscope, label: 'Lab' },
  pharmacy: { icon: Pill, label: 'Pharmacy' },
};

function formatMetricValue(key: PerformanceMetricKey, value: number): string {
  if (key === 'opdVisitsPerMonth') return value.toLocaleString();
  if (key === 'stockOutDays') return `${value}d`;
  return `${Math.round(value)}%`;
}

function normalizeMetricForColor(key: PerformanceMetricKey, value: number): number {
  if (key === 'stockOutDays') return Math.max(0, 100 - value * 3.3);
  if (key === 'opdVisitsPerMonth') return Math.min(100, value / 60);
  return value;
}

// ───────────────────────────── page ─────────────────────────────
export default function HospitalsPage() {
  const { hospitals, loading } = useHospitals();
  const { globalSearch } = useApp();
  const [selectedHospital, setSelectedHospital] = useState<HospitalDoc | null>(null);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterCounty, setFilterCounty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterOwnership, setFilterOwnership] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [colorMetric, setColorMetric] = useState<PerformanceMetricKey>('serviceReadinessScore');
  const [showFilters, setShowFilters] = useState(true);

  // Counties for selected state
  const availableCounties = useMemo(() => {
    if (filterState === 'all') return [];
    return statesAndCounties[filterState] || [];
  }, [filterState]);

  // Reset county when state changes
  useEffect(() => { setFilterCounty('all'); }, [filterState]);

  // ── Filter ──
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const combined = [search, globalSearch].filter(Boolean).join(' ').toLowerCase().trim();
      if (combined) {
        const terms = combined.split(/\s+/);
        const haystack = [h.name || '', h.state || '', h.town || '', h.facilityType || '', ...(h.services || [])].join(' ').toLowerCase();
        if (!terms.every(term => haystack.includes(term))) return false;
      }
      if (filterState !== 'all' && h.state !== filterState) return false;
      if (filterCounty !== 'all' && h.county !== filterCounty) return false;
      if (filterType !== 'all' && h.facilityType !== filterType) return false;
      if (filterOwnership !== 'all' && h.ownership !== filterOwnership) return false;
      if (filterStatus !== 'all' && h.operationalStatus !== filterStatus) return false;
      if (filterService !== 'all' && h.serviceFlags) {
        const flags = h.serviceFlags as Record<string, boolean>;
        if (!flags[filterService]) return false;
      }
      return true;
    });
  }, [hospitals, search, globalSearch, filterState, filterCounty, filterType, filterOwnership, filterStatus, filterService]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const f = filteredHospitals;
    const n = f.length || 1;
    const functional = f.filter(h => h.operationalStatus === 'functional').length;
    const avgReporting = f.reduce((s, h) => s + (h.performance?.reportingCompleteness || 0), 0) / n;
    const avgReadiness = f.reduce((s, h) => s + (h.performance?.serviceReadinessScore || 0), 0) / n;
    const coverageGaps = f.filter(h => (h.performance?.immunizationCoverage || 0) < 50).length;
    const totalStaff = f.reduce((s, h) => s + (h.doctors || 0) + (h.nurses || 0) + (h.clinicalOfficers || 0), 0);
    const totalBeds = f.reduce((s, h) => s + (h.totalBeds || 0), 0);
    return {
      total: f.length,
      pctFunctional: f.length ? Math.round((functional / f.length) * 100) : 0,
      avgReporting: Math.round(avgReporting),
      avgReadiness: Math.round(avgReadiness),
      coverageGaps,
      staffPerBed: totalBeds ? (totalStaff / totalBeds).toFixed(1) : '—',
    };
  }, [filteredHospitals]);

  // ── CSV export ──
  const handleExport = useCallback(() => {
    const headers = ['Name', 'Type', 'State', 'County', 'Town', 'Ownership', 'Status', 'Beds',
      'Doctors', 'Nurses', 'Reporting%', 'Readiness%', 'Medicines%', 'Staffing%',
      'ANC Coverage%', 'EPI Coverage%', 'Quality', 'OPD/Month', 'Stock-out Days'];
    const rows = filteredHospitals.map(h => [
      h.name, TYPE_LABELS[h.facilityType] || h.facilityType, h.state, h.county, h.town,
      h.ownership, h.operationalStatus, h.totalBeds,
      h.doctors, h.nurses,
      h.performance?.reportingCompleteness, h.performance?.serviceReadinessScore,
      h.performance?.tracerMedicineAvailability, h.performance?.staffingScore,
      h.performance?.ancCoverage, h.performance?.immunizationCoverage,
      h.performance?.qualityScore, h.performance?.opdVisitsPerMonth, h.performance?.stockOutDays,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facility-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredHospitals]);

  if (loading) {
    return (
      <>
        <TopBar title="Health Facility Performance" />
        <main className="flex-1 p-4 sm:p-5 flex items-center justify-center page-enter">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading facilities...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Health Facility Performance" />
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* ── Filter Bar ── */}
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search facilities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md text-xs outline-none"
                style={{ width: '160px', background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium"
              style={{
                background: showFilters ? 'rgba(43,111,224,0.12)' : 'var(--overlay-subtle)',
                color: showFilters ? 'var(--taban-blue)' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              <Filter className="w-3 h-3" />
              Filters
              <ChevronDown className="w-3 h-3" style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium"
            style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>

        {/* ── Expanded filters ── */}
        {showFilters && (
          <div className="px-3 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
            <FilterDropdown label="State" value={filterState} onChange={setFilterState} options={[{ value: 'all', label: 'All States' }, ...states.map(s => ({ value: s, label: s }))]} />
            {availableCounties.length > 0 && (
              <FilterDropdown label="County" value={filterCounty} onChange={setFilterCounty} options={[{ value: 'all', label: 'All Counties' }, ...availableCounties.map(c => ({ value: c, label: c }))]} />
            )}
            <FilterDropdown label="Type" value={filterType} onChange={setFilterType} options={[{ value: 'all', label: 'All Types' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
            <FilterDropdown label="Ownership" value={filterOwnership} onChange={setFilterOwnership} options={[{ value: 'all', label: 'All' }, ...Object.entries(OWNERSHIP_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
            <FilterDropdown label="Service" value={filterService} onChange={setFilterService} options={[{ value: 'all', label: 'All Services' }, ...Object.entries(SERVICE_FLAG_ICONS).map(([k, v]) => ({ value: k, label: v.label }))]} />
            <FilterDropdown label="Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-light)' }} />
            <FilterDropdown label="Color by" value={colorMetric} onChange={v => setColorMetric(v as PerformanceMetricKey)} options={METRIC_KEYS.map(k => ({ value: k, label: METRIC_LABELS[k] }))} />
          </div>
        )}

        {/* ── KPI Strip ── */}
        <div className="px-3 py-2 grid grid-cols-6 gap-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <KpiCard label="Total Facilities" value={kpis.total} icon={Building2} color="var(--taban-blue)" />
          <KpiCard label="% Functional" value={`${kpis.pctFunctional}%`} icon={ShieldCheck} color={getPerformanceColor(kpis.pctFunctional)} />
          <KpiCard label="Avg Reporting" value={`${kpis.avgReporting}%`} icon={Activity} color={getPerformanceColor(kpis.avgReporting)} />
          <KpiCard label="Avg Readiness" value={`${kpis.avgReadiness}%`} icon={Stethoscope} color={getPerformanceColor(kpis.avgReadiness)} />
          <KpiCard label="Coverage Gaps" value={kpis.coverageGaps} icon={Syringe} color={kpis.coverageGaps > 5 ? '#EF4444' : '#F59E0B'} />
          <KpiCard label="Staff/Bed" value={kpis.staffPerBed} icon={Users} color="var(--taban-blue)" />
        </div>


        {/* ── Facility List / Profile ── */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {selectedHospital ? (
              <div className="max-w-2xl mx-auto">
                <FacilityProfile
                  hospital={selectedHospital}
                  onClose={() => setSelectedHospital(null)}
                />
              </div>
            ) : (
              <FacilityList
                hospitals={filteredHospitals}
                colorMetric={colorMetric}
                onSelect={setSelectedHospital}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════
//  Filter Dropdown
// ═══════════════════════════════════════════
function FilterDropdown({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== 'all' && value !== options[0]?.value;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-[11px] font-semibold cursor-pointer transition-colors"
        style={{
          background: isActive ? 'rgba(43,111,224,0.08)' : 'var(--bg-card)',
          color: isActive ? '#2B6FE0' : 'var(--text-primary)',
          border: isActive ? '1px solid rgba(43,111,224,0.2)' : '1px solid var(--border-light)',
          borderRadius: 'var(--input-radius)',
          padding: '5px 28px 5px 10px',
          maxWidth: '160px',
          minHeight: '30px',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════
//  KPI Card
// ═══════════════════════════════════════════
function KpiCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card-elevated p-2.5 flex items-center gap-3">
      <div className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Facility List (no selection)
// ═══════════════════════════════════════════
function FacilityList({ hospitals, colorMetric, onSelect }: {
  hospitals: HospitalDoc[];
  colorMetric: PerformanceMetricKey;
  onSelect: (h: HospitalDoc) => void;
}) {
  return (
    <>
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Facilities ({hospitals.length})</p>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
        {hospitals.map(h => {
          const metricVal = h.performance ? (h.performance[colorMetric as keyof typeof h.performance] as number) : 0;
          const normVal = normalizeMetricForColor(colorMetric, metricVal);
          return (
            <button
              key={h._id}
              onClick={() => onSelect(h)}
              className="w-full text-left px-3 py-2 transition-colors hover:opacity-80"
              style={{ background: 'transparent' }}
            >
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                  style={{ background: getMetricColorInterpolated(normVal) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{h.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {h.town}, {h.state}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium" style={{ color: getPerformanceColor(normVal) }}>
                      {METRIC_LABELS[colorMetric]}: {formatMetricValue(colorMetric, metricVal)}
                    </span>
                    {h.operationalStatus && (
                      <span className="flex items-center gap-0.5 text-[9px]" style={{ color: STATUS_COLORS[h.operationalStatus] }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: STATUS_COLORS[h.operationalStatus] }} />
                        {STATUS_LABELS[h.operationalStatus]}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: 'rgba(43,111,224,0.12)', color: '#60A5FA' }}
                >
                  {TYPE_SHORT[h.facilityType] || h.facilityType}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  Facility Profile Panel (with selection)
// ═══════════════════════════════════════════
function FacilityProfile({ hospital, onClose }: {
  hospital: HospitalDoc;
  onClose: () => void;
}) {
  const formatLastSync = (iso: string) => {
    if (!iso) return 'Unknown';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Unknown';
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const syncColor = (status: string) => {
    switch (status) {
      case 'online': return '#4ADE80';
      case 'syncing': return '#FCD34D';
      case 'offline': return '#94A3B8';
      default: return '#94A3B8';
    }
  };

  const typeBadgeStyle = (type: string) => {
    switch (type) {
      case 'national_referral': return { background: 'rgba(139,92,246,0.16)', color: '#A78BFA' };
      case 'state_hospital': return { background: 'rgba(43,111,224,0.14)', color: '#60A5FA' };
      case 'county_hospital': return { background: 'rgba(252,211,77,0.14)', color: '#FCD34D' };
      case 'phcc': return { background: 'rgba(43,111,224,0.14)', color: '#10B981' };
      case 'phcu': return { background: 'rgba(100,116,139,0.16)', color: '#A0B1C8' };
      default: return { background: 'rgba(100,116,139,0.16)', color: '#A0B1C8' };
    }
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{hospital.name}</h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="badge text-[10px]" style={typeBadgeStyle(hospital.facilityType)}>
              {TYPE_LABELS[hospital.facilityType] || hospital.facilityType}
            </span>
            {hospital.ownership && (
              <span className="badge text-[9px]" style={{ background: 'rgba(100,116,139,0.12)', color: '#94A3B8' }}>
                {OWNERSHIP_LABELS[hospital.ownership] || hospital.ownership}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="w-2.5 h-2.5" />
              {hospital.town}, {hospital.state}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors flex-shrink-0"
          style={{ background: 'var(--overlay-subtle)' }}
        >
          <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Operational status + sync */}
      <div className="flex items-center gap-2 mb-3">
        {hospital.operationalStatus && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
            background: `${STATUS_COLORS[hospital.operationalStatus]}18`,
            color: STATUS_COLORS[hospital.operationalStatus],
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[hospital.operationalStatus] }} />
            {STATUS_LABELS[hospital.operationalStatus]}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px]" style={{ color: syncColor(hospital.syncStatus) }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: syncColor(hospital.syncStatus) }} />
          {hospital.syncStatus}
          {hospital.syncStatus === 'syncing' && <RefreshCw className="w-2.5 h-2.5 sync-pulse" />}
        </span>
        <span className="text-[9px] ml-auto" style={{ color: 'var(--text-muted)' }}>
          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
          {formatLastSync(hospital.lastSync)}
        </span>
      </div>

      {/* ── Performance Metrics Grid (9 cards) ── */}
      {hospital.performance && (
        <>
          <SectionLabel icon={Eye} label="Performance Metrics" />
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {PERCENTAGE_METRICS.map(key => {
              const val = hospital.performance![key as keyof typeof hospital.performance] as number;
              const norm = normalizeMetricForColor(key, val);
              return (
                <div key={key} className="p-1.5 rounded-lg text-center" style={{ background: getPerformanceBg(norm) }}>
                  <p className="text-[8px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {METRIC_LABELS[key]}
                  </p>
                  <p className="text-sm font-bold" style={{ color: getPerformanceColor(norm) }}>
                    {formatMetricValue(key, val)}
                  </p>
                </div>
              );
            })}
            {/* Stock-out days */}
            <div className="p-1.5 rounded-lg text-center" style={{ background: getPerformanceBg(normalizeMetricForColor('stockOutDays', hospital.performance.stockOutDays)) }}>
              <p className="text-[8px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Stock-outs</p>
              <p className="text-sm font-bold" style={{ color: getPerformanceColor(normalizeMetricForColor('stockOutDays', hospital.performance.stockOutDays)) }}>
                {hospital.performance.stockOutDays}d
              </p>
            </div>
            {/* OPD visits */}
            <div className="p-1.5 rounded-lg text-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
              <p className="text-[8px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>OPD/Mo</p>
              <p className="text-sm font-bold" style={{ color: '#3B82F6' }}>
                {hospital.performance.opdVisitsPerMonth.toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Sparkline Trends ── */}
      {hospital.monthlyTrends && hospital.monthlyTrends.length > 0 && (
        <>
          <SectionLabel icon={Activity} label="6-Month Trend" />
          <div className="mb-3 card-elevated p-2">
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={hospital.monthlyTrends} margin={{ top: 2, right: 4, left: 4, bottom: 2 }}>
                <Line type="monotone" dataKey="opdVisits" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="reportingTimeliness" stroke="#10B981" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-0.5 rounded" style={{ background: '#3B82F6' }} /> OPD
              </span>
              <span className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-0.5 rounded" style={{ background: '#10B981' }} /> Reporting
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Service Flags ── */}
      {hospital.serviceFlags && (
        <>
          <SectionLabel icon={FlaskConical} label="Service Availability" />
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(SERVICE_FLAG_ICONS).map(([key, { icon: FlagIcon, label }]) => {
              const available = (hospital.serviceFlags as Record<string, boolean>)?.[key];
              return (
                <span
                  key={key}
                  className="badge text-[9px] flex items-center gap-1"
                  style={{
                    background: available ? 'rgba(43,111,224,0.12)' : 'rgba(100,116,139,0.08)',
                    color: available ? '#2B6FE0' : '#94A3B8',
                    opacity: available ? 1 : 0.6,
                  }}
                >
                  <FlagIcon className="w-2.5 h-2.5" />
                  {label}
                </span>
              );
            })}
          </div>
        </>
      )}

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Patients</p>
          <p className="text-base font-bold" style={{ color: 'var(--taban-blue)' }}>{hospital.patientCount.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Today&apos;s Visits</p>
          <p className="text-base font-bold" style={{ color: '#2B6FE0' }}>{hospital.todayVisits}</p>
        </div>
      </div>

      {/* ── Beds ── */}
      <SectionLabel icon={BedDouble} label={`Beds — ${hospital.totalBeds} total`} />
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { label: 'ICU', value: hospital.icuBeds, color: '#F87171', bg: 'rgba(229,46,66,0.12)' },
          { label: 'Maternity', value: hospital.maternityBeds, color: '#F472B6', bg: 'rgba(236,72,153,0.12)' },
          { label: 'Pediatric', value: hospital.pediatricBeds, color: '#60A5FA', bg: 'rgba(43,111,224,0.12)' },
          { label: 'General', value: hospital.totalBeds - hospital.icuBeds - hospital.maternityBeds - hospital.pediatricBeds, color: '#94A3B8', bg: 'rgba(100,116,139,0.12)' },
        ].map(b => (
          <div key={b.label} className="p-1.5 rounded text-center" style={{ background: b.bg }}>
            <p className="text-[9px] font-medium" style={{ color: b.color }}>{b.label}</p>
            <p className="text-xs font-bold" style={{ color: b.color }}>{b.value}</p>
          </div>
        ))}
      </div>

      {/* ── Staffing ── */}
      <SectionLabel icon={Stethoscope} label="Staff" />
      <div className="space-y-1.5 mb-3">
        {[
          { label: 'Doctors', value: hospital.doctors, color: 'var(--taban-blue)' },
          { label: 'Clinical Officers', value: hospital.clinicalOfficers, color: '#A78BFA' },
          { label: 'Nurses', value: hospital.nurses, color: '#F472B6' },
          { label: 'Lab Technicians', value: hospital.labTechnicians, color: '#FCD34D' },
          { label: 'Pharmacists', value: hospital.pharmacists, color: '#2B6FE0' },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Infrastructure ── */}
      <SectionLabel icon={Zap} label="Infrastructure" />
      <div className="flex flex-wrap gap-1 mb-2">
        {hospital.hasElectricity ? (
          <InfraBadge icon={Zap} label="Power" color="#FCD34D" bg="rgba(252,211,77,0.10)" />
        ) : (
          <InfraBadge icon={ZapOff} label="No Power" color="#94A3B8" bg="rgba(100,116,139,0.12)" />
        )}
        {hospital.hasGenerator && <InfraBadge icon={Activity} label="Generator" color="#4ADE80" bg="rgba(43,111,224,0.12)" />}
        {hospital.hasSolar && <InfraBadge icon={Sun} label="Solar" color="#FCD34D" bg="rgba(252,211,77,0.08)" />}
        {hospital.hasInternet ? (
          <InfraBadge icon={Signal} label={hospital.internetType} color="#60A5FA" bg="rgba(43,111,224,0.12)" />
        ) : (
          <InfraBadge icon={WifiOff} label="No Internet" color="#94A3B8" bg="rgba(100,116,139,0.12)" />
        )}
        {hospital.hasAmbulance && <InfraBadge icon={Truck} label="Ambulance" color="#F87171" bg="rgba(229,46,66,0.12)" />}
        {hospital.emergency24hr && <InfraBadge icon={HeartPulse} label="24hr ER" color="#EF4444" bg="rgba(229,46,66,0.08)" />}
      </div>

      {/* Electricity hours */}
      {hospital.electricityHours > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Power</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--overlay-medium)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(hospital.electricityHours / 24) * 100}%`,
                background: hospital.electricityHours >= 12 ? '#4ADE80' : hospital.electricityHours >= 6 ? '#FCD34D' : '#F87171',
              }}
            />
          </div>
          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
            {hospital.electricityHours}h/24h
          </span>
        </div>
      )}

      {/* GPS */}
      <div className="p-2 rounded-lg text-[10px]" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-muted)' }}>
        <span className="font-mono">{(hospital.lat ?? 0).toFixed(4)}°N, {(hospital.lng ?? 0).toFixed(4)}°E</span>
        {hospital.county && <span className="ml-2">| County: {hospital.county}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Small helper components
// ═══════════════════════════════════════════
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function InfraBadge({ icon: Icon, label, color, bg }: { icon: React.ElementType; label: string; color: string; bg: string }) {
  return (
    <span className="badge text-[10px]" style={{ background: bg, color }}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
