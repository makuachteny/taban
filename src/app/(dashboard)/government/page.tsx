'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import TopBar from '@/components/TopBar';
import {
  Building2, Users, BedDouble, Stethoscope, Wifi, WifiOff,
  AlertTriangle, ArrowRightLeft, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronRight, Download, Calendar,
  GitCompareArrows, ArrowUpDown, Check
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { usePatients } from '@/lib/hooks/usePatients';
import { useSurveillance } from '@/lib/hooks/useSurveillance';
import { useReferrals } from '@/lib/hooks/useReferrals';
import { weeklyDiseaseData, casesByState } from '@/data/mock';
import type { HospitalDoc } from '@/lib/db-types';

// Chart tooltip
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="card-elevated p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', fontSize: '0.75rem', borderRadius: '12px' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Circular progress ring
function CircularGauge({ value, label, color, size = 100, strokeWidth = 8 }: {
  value: number; label: string; color: string; size?: number; strokeWidth?: number;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-light)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] font-medium mt-2 text-center" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// Data Quality Badge
function DataQualityBadge({ score }: { score: number }) {
  const color = score > 90 ? 'var(--color-success)' : score >= 70 ? 'var(--color-warning)' : 'var(--color-danger)';
  const bg = score > 90 ? 'rgba(16,185,129,0.12)' : score >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>
      {score}%
    </span>
  );
}

const FACILITY_COLORS = ['var(--color-success)', '#60A5FA', '#A855F7', 'var(--color-warning)', 'var(--text-muted)'];

// Calculate data quality score for a hospital
function calcDataQuality(h: HospitalDoc): number {
  const fields = [
    h.name, h.state, h.facilityType, h.totalBeds, h.doctors, h.nurses,
    h.clinicalOfficers, h.syncStatus, h.lastSync, h.patientCount,
    h.operationalStatus, h.performance?.reportingCompleteness,
    h.performance?.serviceReadinessScore, h.performance?.immunizationCoverage,
    h.performance?.qualityScore, h.county,
  ];
  const filled = fields.filter(f => f !== undefined && f !== null && f !== '' && f !== 0).length;
  return Math.round((filled / fields.length) * 100);
}

export default function GovernmentDashboardPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { hospitals } = useHospitals();
  const { patients: allPatients } = usePatients();
  const { alerts: diseaseAlerts } = useSurveillance();
  const { referrals } = useReferrals();

  // State/County Drill-Down state
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  // DHIS2 Export state
  const [dhis2Period, setDhis2Period] = useState<'monthly' | 'quarterly'>('monthly');

  // Facility Comparison state
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [compDropdownOpen, setCompDropdownOpen] = useState(false);

  // Hospital table sort
  const [tableSortBy, setTableSortBy] = useState<'name' | 'quality'>('name');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'government') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // National aggregates
  const totalHospitals = hospitals.length;
  const totalPatients = allPatients.length;
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalDoctors = hospitals.reduce((sum, h) => sum + h.doctors, 0);
  const totalNurses = hospitals.reduce((sum, h) => sum + h.nurses, 0);
  const totalCOs = hospitals.reduce((sum, h) => sum + h.clinicalOfficers, 0);
  const totalStaff = totalDoctors + totalNurses + totalCOs;
  const onlineHospitals = hospitals.filter(h => h.syncStatus === 'online').length;
  const offlineHospitals = hospitals.filter(h => h.syncStatus === 'offline').length;
  const activeAlerts = diseaseAlerts.filter(a => a.alertLevel === 'emergency' || a.alertLevel === 'warning').length;
  const pendingReferrals = referrals.filter(r => r.status === 'sent' || r.status === 'received').length;

  // Facility type distribution for donut
  const facilityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const labels: Record<string, string> = {
      national_referral: 'National Referral',
      state_hospital: 'State Hospital',
      county_hospital: 'County Hospital',
      phcc: 'PHCC',
      phcu: 'PHCU',
    };
    hospitals.forEach(h => {
      const t = labels[h.facilityType] || h.facilityType;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [hospitals]);

  // Aggregated monthly OPD trend from hospitals
  const opdTrendData = useMemo(() => {
    const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
    const labels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map((m, i) => {
      let opd = 0, anc = 0, imm = 0;
      hospitals.forEach(h => {
        const t = h.monthlyTrends?.find((t: { month: string }) => t.month === m);
        if (t) {
          opd += t.opdVisits || 0;
          anc += t.ancVisits || 0;
          imm += t.immunizations || 0;
        }
      });
      return { month: labels[i], 'OPD Visits': opd, 'ANC Visits': anc, 'Immunizations': imm };
    });
  }, [hospitals]);

  // Top cases by state for horizontal bar chart (sorted by malaria)
  const stateBarData = useMemo(() => {
    return [...casesByState]
      .sort((a, b) => b.malaria - a.malaria)
      .slice(0, 8)
      .map(s => ({ ...s, state: s.state.replace('W. Bahr el Ghazal', 'WBEG').replace('N. Bahr el Ghazal', 'NBEG').replace('W. Equatoria', 'WEQ').replace('E. Equatoria', 'EEQ') }));
  }, []);

  // Staff distribution per top hospitals (grouped bar)
  const staffDistribution = useMemo(() => {
    return hospitals
      .sort((a, b) => (b.doctors + b.nurses + b.clinicalOfficers) - (a.doctors + a.nurses + a.clinicalOfficers))
      .slice(0, 8)
      .map(h => ({
        name: h.name.replace(' Hospital', '').replace(' Teaching', '').replace('Juba ', 'J.').slice(0, 15),
        Doctors: h.doctors,
        Nurses: h.nurses,
        'Clinical Officers': h.clinicalOfficers,
      }));
  }, [hospitals]);

  // Gauge metrics
  const avgReporting = useMemo(() => {
    if (!hospitals.length) return 0;
    return Math.round(hospitals.reduce((s, h) => s + (h.performance?.reportingCompleteness || 0), 0) / hospitals.length);
  }, [hospitals]);

  const avgReadiness = useMemo(() => {
    if (!hospitals.length) return 0;
    return Math.round(hospitals.reduce((s, h) => s + (h.performance?.serviceReadinessScore || 0), 0) / hospitals.length);
  }, [hospitals]);

  const avgImmCoverage = useMemo(() => {
    if (!hospitals.length) return 0;
    return Math.round(hospitals.reduce((s, h) => s + (h.performance?.immunizationCoverage || 0), 0) / hospitals.length);
  }, [hospitals]);

  const functionalPct = useMemo(() => {
    if (!hospitals.length) return 0;
    return Math.round((hospitals.filter(h => h.operationalStatus === 'functional').length / hospitals.length) * 100);
  }, [hospitals]);

  const sortedAlerts = useMemo(() => {
    return [...diseaseAlerts].sort((a, b) => {
      const order: Record<string, number> = { emergency: 0, warning: 1, watch: 2, normal: 3 };
      return (order[a.alertLevel] ?? 3) - (order[b.alertLevel] ?? 3);
    });
  }, [diseaseAlerts]);

  // ===== STATE/COUNTY DRILL-DOWN DATA =====
  const hospitalsByState = useMemo(() => {
    const grouped: Record<string, HospitalDoc[]> = {};
    hospitals.forEach(h => {
      const state = h.state || 'Unknown';
      if (!grouped[state]) grouped[state] = [];
      grouped[state].push(h);
    });
    return grouped;
  }, [hospitals]);

  const stateAggregates = useMemo(() => {
    return Object.entries(hospitalsByState).map(([state, hosps]) => ({
      state,
      hospitals: hosps,
      totalPatients: hosps.reduce((s, h) => s + h.patientCount, 0),
      totalBeds: hosps.reduce((s, h) => s + h.totalBeds, 0),
      totalStaff: hosps.reduce((s, h) => s + h.doctors + h.nurses + h.clinicalOfficers, 0),
      facilityCount: hosps.length,
    })).sort((a, b) => b.totalPatients - a.totalPatients);
  }, [hospitalsByState]);

  const toggleState = useCallback((state: string) => {
    setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }));
  }, []);

  // ===== DHIS2 EXPORT =====
  const handleDhis2Export = useCallback(() => {
    const now = new Date();
    const period = dhis2Period === 'monthly'
      ? `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
      : `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    const dataValues: Array<{ dataElement: string; period: string; orgUnit: string; value: number }> = [];

    // Disease counts from casesByState
    casesByState.forEach(s => {
      const orgUnit = s.state.replace(/\s+/g, '_').toUpperCase();
      dataValues.push({ dataElement: 'MALARIA_CASES', period, orgUnit, value: s.malaria });
      dataValues.push({ dataElement: 'CHOLERA_CASES', period, orgUnit, value: s.cholera });
      dataValues.push({ dataElement: 'MEASLES_CASES', period, orgUnit, value: s.measles });
      dataValues.push({ dataElement: 'TB_CASES', period, orgUnit, value: s.tb });
      dataValues.push({ dataElement: 'HIV_CASES', period, orgUnit, value: s.hiv });
    });

    // Per-hospital patient counts, immunizations
    hospitals.forEach(h => {
      const orgUnit = h._id;
      dataValues.push({ dataElement: 'PATIENT_COUNT', period, orgUnit, value: h.patientCount });
      const lastTrend = h.monthlyTrends?.[h.monthlyTrends.length - 1];
      if (lastTrend) {
        dataValues.push({ dataElement: 'IMMUNIZATION_COUNT', period, orgUnit, value: lastTrend.immunizations || 0 });
        dataValues.push({ dataElement: 'OPD_VISITS', period, orgUnit, value: lastTrend.opdVisits || 0 });
        dataValues.push({ dataElement: 'ANC_VISITS', period, orgUnit, value: lastTrend.ancVisits || 0 });
      }
    });

    const dhis2Payload = {
      dataValueSet: {
        dataValues,
      },
    };

    const blob = new Blob([JSON.stringify(dhis2Payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhis2_export_${period}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dhis2Period, hospitals]);

  // ===== FACILITY COMPARISON =====
  const comparisonFacilities = useMemo(() => {
    return hospitals.filter(h => comparisonIds.includes(h._id));
  }, [hospitals, comparisonIds]);

  const toggleCompFacility = useCallback((id: string) => {
    setComparisonIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  if (!currentUser || currentUser.role !== 'government') return null;

  const typeLabel = (type: string) => {
    switch (type) {
      case 'national_referral': return 'National Referral';
      case 'state_hospital': return 'State Hospital';
      case 'county_hospital': return 'County Hospital';
      default: return type;
    }
  };

  const syncDotColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--color-success)';
      case 'offline': return 'var(--text-muted)';
      case 'syncing': return 'var(--color-warning)';
      default: return 'var(--text-muted)';
    }
  };

  /* formatLastSync - available for future use
  const formatLastSync = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }; */

  // Helper: get best value for comparison highlighting
  const getBest = (vals: number[], higherIsBetter = true) => {
    if (higherIsBetter) return Math.max(...vals);
    return Math.min(...vals);
  };

  return (
    <>
      <TopBar title="National Dashboard" />
      <main className="page-container page-enter">

        {/* KPI STRIP */}
        <div className="kpi-grid mb-4">
          {[
            { label: 'Hospitals', value: totalHospitals.toString(), icon: Building2, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)', href: '/hospitals' },
            { label: 'Patients', value: totalPatients.toLocaleString(), icon: Users, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)', href: '/hospitals' },
            { label: 'Beds', value: totalBeds.toLocaleString(), icon: BedDouble, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)', href: '/hospitals' },
            { label: 'Staff', value: totalStaff.toLocaleString(), icon: Stethoscope, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)', href: '/hospitals' },
            { label: 'Online', value: onlineHospitals.toString(), icon: Wifi, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)', href: '/hospitals' },
            { label: 'Offline', value: offlineHospitals.toString(), icon: WifiOff, color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.10)', href: '/hospitals' },
            { label: 'Alerts', value: activeAlerts.toString(), icon: AlertTriangle, color: 'var(--color-danger)', bg: 'rgba(229,46,66,0.08)', href: '/surveillance' },
            { label: 'Referrals', value: pendingReferrals.toString(), icon: ArrowRightLeft, color: 'var(--accent-primary)', bg: 'rgba(0,119,215,0.10)' },
          ].map(stat => (
            <div key={stat.label} className="kpi" onClick={() => stat.href && router.push(stat.href)}>
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

        {/* CHARTS ROW 1: Disease Trends + Facility Distribution + Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

          {/* Disease Trend Line Chart */}
          <div className="lg:col-span-2 glass-section flex flex-col">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Disease Trends</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,46,66,0.1)', color: 'var(--color-danger)' }}>Surveillance</span>
            </div>
            <div className="p-3 flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyDiseaseData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.65rem', paddingTop: '4px' }} />
                  <Line type="monotone" dataKey="malaria" name="Malaria" stroke="#E52E42" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="diarrhea" name="Diarrhea" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="pneumonia" name="Pneumonia" stroke="#FCD34D" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="measles" name="Measles" stroke="#A855F7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cholera" name="Cholera" stroke="#3ECF8E" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Facility Distribution Donut + Gauges */}
          <div className="space-y-3">
            {/* Donut Chart */}
            <div className="glass-section">
              <div className="glass-section-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Facility Types</span>
              </div>
              <div className="p-3 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                      <Pie data={facilityDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={32} paddingAngle={2}>
                        {facilityDistribution.map((_, i) => (
                          <Cell key={i} fill={FACILITY_COLORS[i % FACILITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{totalHospitals}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  {facilityDistribution.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: FACILITY_COLORS[i % FACILITY_COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gauge Cards */}
            <div className="glass-section">
              <div className="glass-section-header">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>National Performance</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <CircularGauge value={avgReporting} label="Reporting" color="#60A5FA" size={72} strokeWidth={5} />
                <CircularGauge value={avgReadiness} label="Readiness" color="#0077D7" size={72} strokeWidth={5} />
                <CircularGauge value={avgImmCoverage} label="EPI Coverage" color="#A855F7" size={72} strokeWidth={5} />
                <CircularGauge value={functionalPct} label="Functional" color="#FCD34D" size={72} strokeWidth={5} />
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 2: Cases by State (horizontal bar) + OPD Trend + Staff Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

          {/* Cases by State */}
          <div className="glass-section">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Malaria Cases by State</span>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={stateBarData} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <YAxis type="category" dataKey="state" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="malaria" name="Malaria" fill="#E52E42" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* National OPD Trend */}
          <div className="glass-section">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>National Health Visits</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>6 Months</span>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={opdTrendData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '0.6rem', paddingTop: '4px' }} />
                  <Line type="monotone" dataKey="OPD Visits" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 3, fill: '#60A5FA' }} />
                  <Line type="monotone" dataKey="ANC Visits" stroke="#EC4899" strokeWidth={2} dot={{ r: 3, fill: '#EC4899' }} />
                  <Line type="monotone" dataKey="Immunizations" stroke="#A855F7" strokeWidth={2} dot={{ r: 3, fill: '#A855F7' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Distribution */}
          <div className="glass-section">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Staff by Hospital</span>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={staffDistribution} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} angle={-35} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '0.6rem', paddingTop: '4px' }} />
                  <Bar dataKey="Doctors" fill="#60A5FA" radius={[3, 3, 0, 0]} barSize={10} />
                  <Bar dataKey="Nurses" fill="#3ECF8E" radius={[3, 3, 0, 0]} barSize={10} />
                  <Bar dataKey="Clinical Officers" fill="#A855F7" radius={[3, 3, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* DHIS2 EXPORT SECTION */}
        <div className="card-elevated p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                <Download className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export to DHIS2</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Download data in DHIS2 data value set format</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <select
                  value={dhis2Period}
                  onChange={e => setDhis2Period(e.target.value as 'monthly' | 'quarterly')}
                  className="text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <button
                onClick={handleDhis2Export}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--color-success)' }}
              >
                <Download className="w-3.5 h-3.5" />
                Export .json
              </button>
            </div>
          </div>
        </div>

        {/* STATE/COUNTY DRILL-DOWN TABLE */}
        <div className="card-elevated overflow-hidden mb-4">
          <div className="flex items-center justify-between p-4 pb-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Building2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Hospital Performance by State
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTableSortBy(prev => prev === 'name' ? 'quality' : 'name')}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
              >
                <ArrowUpDown className="w-3 h-3" />
                Sort: {tableSortBy === 'quality' ? 'Data Quality' : 'Name'}
              </button>
              <button onClick={() => router.push('/hospitals')} className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>View All</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>State / Hospital</th>
                  <th>Facilities</th>
                  <th>Patients</th>
                  <th>Beds</th>
                  <th>Staff</th>
                  <th>Data Quality</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stateAggregates.map(sa => {
                  const isExpanded = expandedStates[sa.state] || false;
                  const stateHospitals = tableSortBy === 'quality'
                    ? [...sa.hospitals].sort((a, b) => calcDataQuality(b) - calcDataQuality(a))
                    : [...sa.hospitals].sort((a, b) => a.name.localeCompare(b.name));
                  const avgQuality = sa.hospitals.length > 0
                    ? Math.round(sa.hospitals.reduce((s, h) => s + calcDataQuality(h), 0) / sa.hospitals.length)
                    : 0;
                  return (
                    <React.Fragment key={sa.state}>
                      {/* State Row */}
                      <tr
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleState(sa.state)}
                        style={{ background: 'var(--overlay-subtle)' }}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                            )}
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{sa.state}</span>
                          </div>
                        </td>
                        <td className="font-semibold text-sm">{sa.facilityCount}</td>
                        <td className="font-semibold text-sm">{sa.totalPatients.toLocaleString()}</td>
                        <td className="text-sm">{sa.totalBeds.toLocaleString()}</td>
                        <td className="text-sm">{sa.totalStaff.toLocaleString()}</td>
                        <td><DataQualityBadge score={avgQuality} /></td>
                        <td>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {sa.hospitals.filter(h => h.syncStatus === 'online').length}/{sa.facilityCount} online
                          </span>
                        </td>
                      </tr>
                      {/* Expanded Hospital Rows */}
                      {isExpanded && stateHospitals.map(h => (
                        <tr key={h._id} className="cursor-pointer" onClick={() => router.push(`/hospitals?facility=${h._id}`)}>
                          <td>
                            <div className="flex items-center gap-2 pl-6">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-light)' }}>
                                <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{h.name}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{typeLabel(h.facilityType)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-[10px]" style={{ color: 'var(--text-muted)' }}>--</td>
                          <td className="font-semibold text-sm">{h.patientCount.toLocaleString()}</td>
                          <td className="text-sm">{h.totalBeds}</td>
                          <td className="text-sm">{h.doctors + h.nurses + h.clinicalOfficers}</td>
                          <td><DataQualityBadge score={calcDataQuality(h)} /></td>
                          <td>
                            <span className="flex items-center gap-1 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: syncDotColor(h.syncStatus) }} />
                              {h.syncStatus.charAt(0).toUpperCase() + h.syncStatus.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FACILITY COMPARISON TOOL */}
        <div className="card-elevated p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
              <GitCompareArrows className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Facility Comparison Tool</h3>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Select 2-3 facilities to compare side by side</p>
            </div>
          </div>

          {/* Multi-select dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setCompDropdownOpen(!compDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm"
              style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              <span>
                {comparisonIds.length === 0
                  ? 'Select facilities to compare...'
                  : `${comparisonIds.length} facilit${comparisonIds.length === 1 ? 'y' : 'ies'} selected`}
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
            {compDropdownOpen && (
              <div
                className="absolute z-10 mt-1 w-full rounded-xl shadow-lg max-h-48 overflow-y-auto"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
              >
                {hospitals.map(h => {
                  const selected = comparisonIds.includes(h._id);
                  const disabled = !selected && comparisonIds.length >= 3;
                  return (
                    <button
                      key={h._id}
                      onClick={() => { toggleCompFacility(h._id); }}
                      disabled={disabled}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                      style={{
                        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                        background: selected ? 'rgba(124,58,237,0.08)' : 'transparent',
                        borderBottom: '1px solid var(--border-light)',
                        opacity: disabled ? 0.5 : 1,
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          border: selected ? '2px solid #7C3AED' : '2px solid var(--border-light)',
                          background: selected ? '#7C3AED' : 'transparent',
                        }}
                      >
                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {h.name} <span style={{ color: 'var(--text-muted)' }}>({h.state})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comparison Table */}
          {comparisonFacilities.length >= 2 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {comparisonFacilities.map(f => (
                      <th key={f._id}>{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const metrics: Array<{ label: string; values: number[]; higherBetter: boolean }> = [
                      { label: 'Patients', values: comparisonFacilities.map(f => f.patientCount), higherBetter: true },
                      { label: 'Beds', values: comparisonFacilities.map(f => f.totalBeds), higherBetter: true },
                      { label: 'Staff', values: comparisonFacilities.map(f => f.doctors + f.nurses + f.clinicalOfficers), higherBetter: true },
                      { label: 'Occupancy Rate (%)', values: comparisonFacilities.map(f => f.totalBeds > 0 ? Math.round((f.patientCount / f.totalBeds) * 100) : 0), higherBetter: false },
                      { label: 'Disease Cases (est.)', values: comparisonFacilities.map(f => {
                        const stateData = casesByState.find(s => s.state === f.state);
                        return stateData ? stateData.malaria + stateData.cholera + stateData.measles + stateData.tb : 0;
                      }), higherBetter: false },
                    ];
                    return metrics.map(m => {
                      const best = getBest(m.values, m.higherBetter);
                      return (
                        <tr key={m.label}>
                          <td className="font-medium text-sm">{m.label}</td>
                          {m.values.map((v, i) => (
                            <td key={i}>
                              <span
                                className="font-semibold text-sm"
                                style={{ color: v === best && comparisonFacilities.length > 1 ? 'var(--color-success)' : 'var(--text-primary)' }}
                              >
                                {v.toLocaleString()}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
          {comparisonFacilities.length < 2 && comparisonIds.length > 0 && (
            <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Select at least 2 facilities to compare</p>
          )}
        </div>

        {/* BOTTOM SECTION: Alerts + Referrals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Disease Alerts */}
          <div className="glass-section">
            <div className="glass-section-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Disease Alerts</span>
              </div>
              <button onClick={() => router.push('/surveillance')} className="text-[10px] font-medium" style={{ color: 'var(--accent-primary)' }}>View All</button>
            </div>
            <div className="p-3 space-y-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {sortedAlerts.slice(0, 5).map(alert => (
                <div key={alert._id} className="p-3 rounded-md cursor-pointer" onClick={() => router.push('/surveillance')} style={{
                  background: alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.08)' :
                              alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.08)' : 'rgba(56,189,248,0.06)',
                  border: `1px solid ${alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.15)' : alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.15)' : 'rgba(56,189,248,0.1)'}`,
                }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.disease}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.15)' : alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.15)' : 'rgba(56,189,248,0.15)',
                      color: alert.alertLevel === 'emergency' ? 'var(--color-danger)' : alert.alertLevel === 'warning' ? 'var(--color-warning)' : '#38BDF8',
                    }}>{alert.alertLevel.toUpperCase()}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {alert.state} · {alert.cases} cases · {alert.deaths} deaths
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {alert.trend === 'increasing' ? (
                      <TrendingUp className="w-2.5 h-2.5" style={{ color: 'var(--color-danger)' }} />
                    ) : alert.trend === 'decreasing' ? (
                      <TrendingDown className="w-2.5 h-2.5" style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <Minus className="w-2.5 h-2.5" style={{ color: 'var(--color-warning)' }} />
                    )}
                    <span className="text-[9px]" style={{
                      color: alert.trend === 'increasing' ? 'var(--color-danger)' : alert.trend === 'decreasing' ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>{alert.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Referrals */}
          <div className="glass-section">
            <div className="glass-section-header">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Referrals</span>
              </div>
              <button onClick={() => router.push('/referrals')} className="text-[10px] font-medium" style={{ color: 'var(--accent-primary)' }}>View All</button>
            </div>
            <div className="p-3 space-y-2">
              {referrals.slice(0, 4).map(ref => (
                <div key={ref._id} className="p-2.5 rounded-md" style={{ border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{ref.patientName}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: ref.urgency === 'emergency' ? 'rgba(229,46,66,0.12)' : ref.urgency === 'urgent' ? 'rgba(252,211,77,0.12)' : 'rgba(0,119,215,0.12)',
                      color: ref.urgency === 'emergency' ? 'var(--color-danger)' : ref.urgency === 'urgent' ? 'var(--color-warning)' : 'var(--accent-primary)',
                    }}>{ref.urgency}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{ref.fromHospital} → {ref.toHospital}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ref.department} · {ref.referralDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
