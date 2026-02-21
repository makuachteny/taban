'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import TopBar from '@/components/TopBar';
import {
  Building2, Users, BedDouble, Stethoscope, Wifi, WifiOff,
  AlertTriangle, ArrowRightLeft, TrendingUp, TrendingDown,
  Minus, Clock
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

const FACILITY_COLORS = ['#3ECF8E', '#60A5FA', '#A855F7', '#FCD34D', '#94A3B8'];

export default function GovernmentDashboardPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { hospitals } = useHospitals();
  const { patients: allPatients } = usePatients();
  const { alerts: diseaseAlerts } = useSurveillance();
  const { referrals } = useReferrals();

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
      case 'online': return '#4ADE80';
      case 'offline': return '#94A3B8';
      case 'syncing': return '#FCD34D';
      default: return '#94A3B8';
    }
  };

  const formatLastSync = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <>
      <TopBar title="National Dashboard" />
      <main className="flex-1 p-3 sm:p-4 overflow-auto page-enter">

        {/* ═══ KPI STRIP ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-4">
          {[
            { label: 'Total Hospitals', value: totalHospitals.toString(), icon: Building2, color: '#2B6FE0', bg: 'rgba(43,111,224,0.12)', href: '/hospitals' },
            { label: 'Total Patients', value: totalPatients.toLocaleString(), icon: Users, color: '#2B6FE0', bg: 'rgba(43,111,224,0.12)', href: '/hospitals' },
            { label: 'Total Beds', value: totalBeds.toLocaleString(), icon: BedDouble, color: '#FCD34D', bg: 'rgba(252,211,77,0.10)', href: '/hospitals' },
            { label: 'Total Staff', value: totalStaff.toLocaleString(), icon: Stethoscope, color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', href: '/hospitals' },
            { label: 'Online', value: onlineHospitals.toString(), icon: Wifi, color: '#2B6FE0', bg: 'rgba(43,111,224,0.12)', href: '/hospitals' },
            { label: 'Offline', value: offlineHospitals.toString(), icon: WifiOff, color: '#94A3B8', bg: 'rgba(100,116,139,0.12)', href: '/hospitals' },
            { label: 'Disease Alerts', value: activeAlerts.toString(), icon: AlertTriangle, color: '#E52E42', bg: 'rgba(229,46,66,0.10)', href: '/surveillance' },
            { label: 'Referrals', value: pendingReferrals.toString(), icon: ArrowRightLeft, color: '#FCD34D', bg: 'rgba(252,211,77,0.10)' },
          ].map(stat => (
            <div key={stat.label} className="card-elevated p-2.5 cursor-pointer transition-all hover:scale-[1.02]" onClick={() => stat.href && router.push(stat.href)}>
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ═══ CHARTS ROW 1: Disease Trends + Facility Distribution + Gauges ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

          {/* Disease Trend Line Chart */}
          <div className="lg:col-span-2 glass-section flex flex-col">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Disease Trends</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,46,66,0.1)', color: '#E52E42' }}>Surveillance</span>
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
                <CircularGauge value={avgReadiness} label="Readiness" color="#2B6FE0" size={72} strokeWidth={5} />
                <CircularGauge value={avgImmCoverage} label="EPI Coverage" color="#A855F7" size={72} strokeWidth={5} />
                <CircularGauge value={functionalPct} label="Functional" color="#FCD34D" size={72} strokeWidth={5} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CHARTS ROW 2: Cases by State (horizontal bar) + OPD Trend + Staff Distribution ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

          {/* Cases by State — Horizontal Bar Chart */}
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

          {/* National OPD Trend — Line Chart */}
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

          {/* Staff Distribution — Grouped Bar Chart */}
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

        {/* ═══ BOTTOM SECTION: Hospital Table + Alerts + Referrals ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Hospital Performance Table */}
          <div className="lg:col-span-2 card-elevated overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building2 className="w-4 h-4" style={{ color: '#2B6FE0' }} />
                Hospital Performance
              </h3>
              <button onClick={() => router.push('/hospitals')} className="text-xs font-medium" style={{ color: '#2B6FE0' }}>View All</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>State</th>
                    <th>Status</th>
                    <th>Patients</th>
                    <th>Beds</th>
                    <th>Staff</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map(h => (
                    <tr key={h._id} className="cursor-pointer" onClick={() => router.push('/hospitals')}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43,111,224,0.1)' }}>
                            <Building2 className="w-3.5 h-3.5" style={{ color: '#2B6FE0' }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{h.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{typeLabel(h.facilityType)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">{h.state}</td>
                      <td>
                        <span className="flex items-center gap-1 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: syncDotColor(h.syncStatus) }} />
                          {h.syncStatus.charAt(0).toUpperCase() + h.syncStatus.slice(1)}
                        </span>
                      </td>
                      <td className="font-semibold text-sm">{h.patientCount.toLocaleString()}</td>
                      <td className="text-sm">{h.totalBeds}</td>
                      <td className="text-sm">{h.doctors + h.nurses + h.clinicalOfficers}</td>
                      <td>
                        <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-2.5 h-2.5" />
                          {formatLastSync(h.lastSync)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Alerts + Referrals */}
          <div className="space-y-3">
            {/* Disease Alerts */}
            <div className="glass-section">
              <div className="glass-section-header">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#E52E42' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Disease Alerts</span>
                </div>
                <button onClick={() => router.push('/surveillance')} className="text-[10px] font-medium" style={{ color: '#2B6FE0' }}>View All</button>
              </div>
              <div className="p-3 space-y-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {sortedAlerts.slice(0, 5).map(alert => (
                  <div key={alert._id} className="p-3 rounded-xl cursor-pointer" onClick={() => router.push('/surveillance')} style={{
                    background: alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.08)' :
                                alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.08)' : 'rgba(56,189,248,0.06)',
                    border: `1px solid ${alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.15)' : alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.15)' : 'rgba(56,189,248,0.1)'}`,
                  }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.disease}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: alert.alertLevel === 'emergency' ? 'rgba(229,46,66,0.15)' : alert.alertLevel === 'warning' ? 'rgba(252,211,77,0.15)' : 'rgba(56,189,248,0.15)',
                        color: alert.alertLevel === 'emergency' ? '#E52E42' : alert.alertLevel === 'warning' ? '#FBBF24' : '#38BDF8',
                      }}>{alert.alertLevel.toUpperCase()}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {alert.state} · {alert.cases} cases · {alert.deaths} deaths
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {alert.trend === 'increasing' ? (
                        <TrendingUp className="w-2.5 h-2.5" style={{ color: '#EF4444' }} />
                      ) : alert.trend === 'decreasing' ? (
                        <TrendingDown className="w-2.5 h-2.5" style={{ color: '#4ADE80' }} />
                      ) : (
                        <Minus className="w-2.5 h-2.5" style={{ color: '#FBBF24' }} />
                      )}
                      <span className="text-[9px]" style={{
                        color: alert.trend === 'increasing' ? '#EF4444' : alert.trend === 'decreasing' ? '#4ADE80' : '#FBBF24'
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
                  <ArrowRightLeft className="w-4 h-4" style={{ color: '#FCD34D' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Referrals</span>
                </div>
                <button onClick={() => router.push('/referrals')} className="text-[10px] font-medium" style={{ color: '#2B6FE0' }}>View All</button>
              </div>
              <div className="p-3 space-y-2">
                {referrals.slice(0, 4).map(ref => (
                  <div key={ref._id} className="p-2.5 rounded-xl" style={{ border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{ref.patientName}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: ref.urgency === 'emergency' ? 'rgba(229,46,66,0.12)' : ref.urgency === 'urgent' ? 'rgba(252,211,77,0.12)' : 'rgba(43,111,224,0.12)',
                        color: ref.urgency === 'emergency' ? '#E52E42' : ref.urgency === 'urgent' ? '#FBBF24' : '#2B6FE0',
                      }}>{ref.urgency}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{ref.fromHospital} → {ref.toHospital}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ref.department} · {ref.referralDate}</p>
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
