'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import PageHeader from '@/components/PageHeader';
import {
  AlertTriangle, Shield, Eye, Bell, TrendingUp, TrendingDown,
  Minus, MapPin, Activity, FileText, Calendar, ChevronRight,
  Download, Plus, X,
} from '@/components/icons/lucide';
import { weeklyDiseaseData, casesByState, states } from '@/data/mock';
import { useSurveillance } from '@/lib/hooks/useSurveillance';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

// Chart colors
const COLORS = {
  malaria: 'var(--accent-primary)',
  cholera: 'var(--color-danger)',
  measles: 'var(--color-warning)',
  pneumonia: '#5CB8A8',
  diarrhea: 'var(--color-success)',
  tb: '#D4A843',
  hiv: '#7C3AED',
};

// Alert level ordering for severity sorting
const severityOrder: Record<string, number> = {
  emergency: 0,
  warning: 1,
  watch: 2,
  normal: 3,
};

// Alert level styling
const alertLevelConfig: Record<string, { bg: string; color: string; iconColor: string }> = {
  emergency: { bg: 'rgba(229,46,66,0.16)', color: '#F87171', iconColor: 'var(--color-danger)' },
  warning: { bg: 'rgba(252,211,77,0.12)', color: '#FB923C', iconColor: 'var(--color-warning)' },
  watch: { bg: 'rgba(252,211,77,0.14)', color: 'var(--color-warning)', iconColor: '#CA8A04' },
  normal: { bg: 'rgba(62,207,142,0.12)', color: 'var(--color-success)', iconColor: 'var(--color-success)' },
};

// Hospital map positions - rough placement on SVG to represent South Sudan geography
// Mapped from lat/lng to SVG coordinates within a 600x400 viewBox
function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  // South Sudan approximate bounds: lat 3.5-12, lng 24-36
  const minLat = 3.5, maxLat = 12, minLng = 24, maxLng = 36;
  const padding = 40;
  const width = 600 - 2 * padding;
  const height = 400 - 2 * padding;
  const x = padding + ((lng - minLng) / (maxLng - minLng)) * width;
  const y = padding + ((maxLat - lat) / (maxLat - minLat)) * height;
  return { x, y };
}


const alertDotColors: Record<string, string> = {
  emergency: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  watch: '#CA8A04',
  normal: 'var(--color-success)',
};

// IDSR Weekly Report Summary data
const idsrSummary = [
  { disease: 'Malaria (confirmed)', casesThisWeek: 1620, casesPrevWeek: 1580, deaths: 14, cfrPercent: 0.9 },
  { disease: 'Cholera (suspected)', casesThisWeek: 102, casesPrevWeek: 89, deaths: 12, cfrPercent: 11.8 },
  { disease: 'Measles', casesThisWeek: 156, casesPrevWeek: 145, deaths: 3, cfrPercent: 1.9 },
  { disease: 'Pneumonia', casesThisWeek: 301, casesPrevWeek: 289, deaths: 18, cfrPercent: 6.0 },
  { disease: 'AWD/Diarrhea', casesThisWeek: 645, casesPrevWeek: 678, deaths: 5, cfrPercent: 0.8 },
  { disease: 'Meningitis', casesThisWeek: 23, casesPrevWeek: 19, deaths: 4, cfrPercent: 17.4 },
  { disease: 'Tuberculosis', casesThisWeek: 45, casesPrevWeek: 42, deaths: 2, cfrPercent: 4.4 },
  { disease: 'Hepatitis E', casesThisWeek: 31, casesPrevWeek: 24, deaths: 0, cfrPercent: 0.0 },
  { disease: 'Kala-azar', casesThisWeek: 18, casesPrevWeek: 21, deaths: 1, cfrPercent: 5.6 },
];

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="card-elevated p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

const REPORTABLE_DISEASES = [
  'Malaria', 'Cholera', 'Measles', 'Meningitis', 'Pneumonia', 'Tuberculosis',
  'HIV/AIDS', 'Hepatitis E', 'Kala-azar', 'Yellow Fever', 'Ebola', 'Lassa Fever',
  'Acute Watery Diarrhea', 'Polio (AFP)', 'Neonatal Tetanus', 'Rabies',
  'Typhoid Fever', 'COVID-19', 'Dengue', 'Anthrax',
];

export default function SurveillancePage() {
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('all');
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({
    disease: '',
    state: '',
    county: '',
    cases: 0,
    deaths: 0,
    alertLevel: 'watch' as 'normal' | 'watch' | 'warning' | 'emergency',
    trend: 'increasing' as 'increasing' | 'stable' | 'decreasing',
  });
  const [alertSubmitting, setAlertSubmitting] = useState(false);

  const { currentUser } = useApp();
  const { canRecordVitalEvents, isGovernment, isSuperAdmin } = usePermissions();
  const canReportAlert = canRecordVitalEvents || isGovernment || isSuperAdmin;
  const { showToast } = useToast();
  const { alerts: diseaseAlerts, create: createAlert } = useSurveillance();
  const { hospitals } = useHospitals();

  const handleCreateAlert = async () => {
    if (!alertForm.disease || !alertForm.state || alertForm.cases <= 0) {
      showToast('Disease, state, and cases are required', 'error');
      return;
    }
    try {
      setAlertSubmitting(true);
      await createAlert({
        disease: alertForm.disease,
        state: alertForm.state,
        county: alertForm.county || 'Unknown',
        cases: alertForm.cases,
        deaths: alertForm.deaths,
        alertLevel: alertForm.alertLevel,
        reportDate: new Date().toISOString().slice(0, 10),
        trend: alertForm.trend,
        orgId: currentUser?.orgId,
      });
      const { logAudit } = await import('@/lib/services/audit-service');
      await logAudit('DISEASE_ALERT_REPORTED', currentUser?._id, currentUser?.username,
        `${alertForm.alertLevel.toUpperCase()}: ${alertForm.disease} in ${alertForm.state} — ${alertForm.cases} cases, ${alertForm.deaths} deaths`
      ).catch(() => {});
      showToast('Disease alert reported', 'success');
      setShowNewAlert(false);
      setAlertForm({ disease: '', state: '', county: '', cases: 0, deaths: 0, alertLevel: 'watch', trend: 'increasing' });
    } catch (err) {
      console.error(err);
      showToast('Failed to create alert', 'error');
    } finally {
      setAlertSubmitting(false);
    }
  };

  function getHospitalAlertLevel(hospitalState: string): string {
    const stateAlerts = (diseaseAlerts || []).filter(a => a.state === hospitalState);
    if (stateAlerts.some(a => a.alertLevel === 'emergency')) return 'emergency';
    if (stateAlerts.some(a => a.alertLevel === 'warning')) return 'warning';
    if (stateAlerts.some(a => a.alertLevel === 'watch')) return 'watch';
    return 'normal';
  }

  const sortedAlerts = [...(diseaseAlerts || [])].sort((a, b) => (severityOrder[a.alertLevel] ?? 3) - (severityOrder[b.alertLevel] ?? 3));
  const filteredAlerts = selectedDisease === 'all' ? sortedAlerts : sortedAlerts.filter(a => a.disease === selectedDisease);

  const totalAlerts = (diseaseAlerts || []).length;
  const emergencies = (diseaseAlerts || []).filter(a => a.alertLevel === 'emergency').length;
  const warnings = (diseaseAlerts || []).filter(a => a.alertLevel === 'warning').length;
  const watchItems = (diseaseAlerts || []).filter(a => a.alertLevel === 'watch').length;
  const totalCases = (diseaseAlerts || []).reduce((sum, a) => sum + (a.cases || 0), 0);
  const totalDeaths = (diseaseAlerts || []).reduce((sum, a) => sum + (a.deaths || 0), 0);

  const uniqueDiseases = [...new Set((diseaseAlerts || []).map(a => a.disease))];

  const reportingWeek = 'W6 2026 (Feb 3-9)';

  /**
   * Export the current IDSR report as a JSON blob the user can download.
   * This replaces the previous inert "Export Report" button. We include
   * the alert list, aggregated disease totals, and the reporting week so
   * MOH officers have an offline artifact they can archive.
   */
  const handleExport = () => {
    const payload = {
      reportingWeek,
      generatedAt: new Date().toISOString(),
      totals: { alerts: totalAlerts, emergencies, warnings, watch: watchItems, cases: totalCases, deaths: totalDeaths },
      alerts: diseaseAlerts || [],
      idsrSummary,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surveillance-report-${reportingWeek.replace(/[ ()]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: 'Total Alerts', value: totalAlerts.toString(), icon: Bell, color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)' },
    { label: 'Emergencies', value: emergencies.toString(), icon: AlertTriangle, color: 'var(--color-danger)', bg: 'rgba(229,46,66,0.10)' },
    { label: 'Warnings', value: warnings.toString(), icon: Shield, color: 'var(--color-warning)', bg: 'rgba(252,211,77,0.10)' },
    { label: 'Watch Items', value: watchItems.toString(), icon: Eye, color: '#5CB8A8', bg: 'rgba(43,111,224,0.10)' },
  ];

  return (
    <>
      <TopBar title="Disease Surveillance" />
      <main className="page-container page-enter">
          <PageHeader
            icon={Activity}
            title="Disease Surveillance Dashboard"
            subtitle={`IDSR Reporting Week: ${reportingWeek} · Ministry of Health, Republic of South Sudan`}
            actions={
              <>
                {canReportAlert && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewAlert(true)}>
                    <Plus className="w-4 h-4" />
                    Report Alert
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </>
            }
          />

          {/* Summary Cards */}
          <div className="kpi-grid mb-6">
            {summaryCards.map(stat => (
              <div key={stat.label} className="kpi cursor-pointer" onClick={() => setSelectedDisease('all')}>
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

          {/* Aggregate summary strip */}
          <div className="card-elevated p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="icon-box-sm" style={{ background: 'rgba(20,184,166,0.12)' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: '#5CB8A8' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Cases This Week:</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{totalCases.toLocaleString()}</span>
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border-light)' }} />
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Deaths:</span>
                <span className="text-sm font-bold" style={{ color: 'var(--taban-red)' }}>{totalDeaths}</span>
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border-light)' }} />
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reporting Facilities:</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{hospitals.length}/10</span>
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border-light)' }} />
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>CFR (Cholera):</span>
                <span className="text-sm font-bold" style={{ color: 'var(--taban-red)' }}>13.8%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-4">

              {/* Map Placeholder */}
              <div className="card-elevated">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <MapPin className="w-4 h-4" style={{ color: 'var(--taban-blue)' }} />
                    Hospital Network -- Alert Status by Location
                  </h3>
                  <div className="flex items-center gap-4">
                    {['emergency', 'warning', 'watch', 'normal'].map(level => (
                      <div key={level} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: alertDotColors[level] }} />
                        <span className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <svg viewBox="0 0 600 400" className="w-full" style={{ maxHeight: '340px' }}>
                    {/* Background - South Sudan shape approximation */}
                    <rect x="30" y="20" width="540" height="360" rx="24" ry="24"
                      fill="rgba(43,111,224,0.08)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

                    {/* Country label */}
                    <text x="300" y="55" textAnchor="middle" fontSize="16" fontWeight="600"
                      fill="rgba(255,255,255,0.35)" fontFamily="'Manrope', sans-serif" opacity="0.35">
                      South Sudan
                    </text>

                    {/* Approximate state boundaries - simplified lines */}
                    <line x1="300" y1="80" x2="300" y2="350" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 3" />
                    <line x1="100" y1="200" x2="540" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 3" />
                    <line x1="180" y1="100" x2="180" y2="350" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 3" />
                    <line x1="420" y1="100" x2="420" y2="350" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 3" />

                    {/* White Nile approximation */}
                    <path d="M 410 60 Q 380 120 360 180 Q 340 240 300 280 Q 270 310 240 340"
                      fill="none" stroke="rgba(43,111,224,0.15)" strokeWidth="2" opacity="1" strokeLinecap="round" />
                    <text x="370" y="150" fontSize="9" fill="rgba(43,111,224,0.15)" opacity="1" fontStyle="italic">
                      White Nile
                    </text>

                    {/* Hospital dots */}
                    {hospitals.map(h => {
                      const pos = latLngToSvg(h.lat, h.lng);
                      const alertLevel = getHospitalAlertLevel(h.state);
                      const dotColor = alertDotColors[alertLevel];
                      const isHovered = hoveredHospital === h._id;
                      const radius = h.facilityType === 'national_referral' ? 10 : 7;

                      return (
                        <g key={h._id}
                          onMouseEnter={() => setHoveredHospital(h._id)}
                          onMouseLeave={() => setHoveredHospital(null)}
                          style={{ cursor: 'pointer' }}>
                          {/* Pulse ring for emergencies */}
                          {alertLevel === 'emergency' && (
                            <circle cx={pos.x} cy={pos.y} r={radius + 6} fill="none"
                              stroke={dotColor} strokeWidth="1.5" opacity="0.3">
                              <animate attributeName="r" from={String(radius + 2)} to={String(radius + 10)} dur="1.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}

                          {/* Shadow */}
                          <circle cx={pos.x} cy={pos.y + 1} r={radius} fill="rgba(0,0,0,0.1)" />

                          {/* Main dot */}
                          <circle cx={pos.x} cy={pos.y} r={isHovered ? radius + 2 : radius}
                            fill={dotColor} stroke="#0F1A2E" strokeWidth="2.5"
                            style={{ transition: 'r 0.15s ease' }} />

                          {/* National referral indicator */}
                          {h.facilityType === 'national_referral' && (
                            <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" fontSize="9"
                              fill="white" fontWeight="700">+</text>
                          )}

                          {/* Hover tooltip */}
                          {isHovered && (
                            <g>
                              <rect x={pos.x - 80} y={pos.y - 58} width="160" height="48"
                                rx="6" ry="6" fill="#0F1A2E" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                              <polygon
                                points={`${pos.x - 5},${pos.y - 10} ${pos.x + 5},${pos.y - 10} ${pos.x},${pos.y - 3}`}
                                fill="#0F1A2E" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                              <rect x={pos.x - 80} y={pos.y - 58} width="160" height="48"
                                rx="6" ry="6" fill="#0F1A2E" />
                              <text x={pos.x} y={pos.y - 40} textAnchor="middle" fontSize="10.5"
                                fontWeight="600" fill="#D4CFC5">{h.name}</text>
                              <text x={pos.x} y={pos.y - 27} textAnchor="middle" fontSize="9"
                                fill="#8A9E9A">{h.state}</text>
                              <text x={pos.x} y={pos.y - 15} textAnchor="middle" fontSize="9"
                                fill={dotColor} fontWeight="500">
                                {alertLevel.toUpperCase()} -- {h.patientCount.toLocaleString()} patients
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Weekly Disease Trends */}
              <div className="card-elevated">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--taban-blue)' }} />
                    Weekly Disease Trends (Jan - Feb 2026)
                  </h3>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Source: IDSR Weekly Reports</span>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyDiseaseData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#7B8FA8' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#7B8FA8' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                      <Line type="monotone" dataKey="malaria" name="Malaria" stroke={COLORS.malaria}
                        strokeWidth={2.5} dot={{ r: 4, fill: COLORS.malaria }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="cholera" name="Cholera" stroke={COLORS.cholera}
                        strokeWidth={2} dot={{ r: 3, fill: COLORS.cholera }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="measles" name="Measles" stroke={COLORS.measles}
                        strokeWidth={2} dot={{ r: 3, fill: COLORS.measles }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="pneumonia" name="Pneumonia" stroke={COLORS.pneumonia}
                        strokeWidth={2} dot={{ r: 3, fill: COLORS.pneumonia }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="diarrhea" name="Diarrhea" stroke={COLORS.diarrhea}
                        strokeWidth={2} dot={{ r: 3, fill: COLORS.diarrhea }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cases by State */}
              <div className="card-elevated">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Activity className="w-4 h-4" style={{ color: '#5CB8A8' }} />
                    Disease Cases by State (Cumulative 2026)
                  </h3>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Top 5 diseases shown</span>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={casesByState} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#7B8FA8' }} axisLine={{ stroke: 'var(--border-light)' }}
                        tickLine={false} angle={-25} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11, fill: '#7B8FA8' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="square" iconSize={10}
                        wrapperStyle={{ fontSize: '0.75rem', paddingTop: '4px' }} />
                      <Bar dataKey="malaria" name="Malaria" fill={COLORS.malaria} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="cholera" name="Cholera" fill={COLORS.cholera} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="measles" name="Measles" fill={COLORS.measles} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="tb" name="TB" fill={COLORS.tb} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="hiv" name="HIV" fill={COLORS.hiv} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-4">

              {/* Active Disease Alerts */}
              <div className="card-elevated">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                    Active Disease Alerts
                  </h3>
                  <select
                    value={selectedDisease}
                    onChange={e => setSelectedDisease(e.target.value)}
                    className="text-xs py-1 px-2 rounded-md"
                    style={{
                      width: 'auto',
                      border: '1px solid var(--border-light)',
                      background: 'var(--overlay-subtle)',
                      fontSize: '0.7rem',
                      padding: '4px 28px 4px 8px',
                    }}
                  >
                    <option value="all">All Diseases</option>
                    {uniqueDiseases.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="p-3 data-row-divider-sm" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  {filteredAlerts.map(alert => {
                    const config = alertLevelConfig[alert.alertLevel];
                    return (
                      <div key={alert._id} className="p-3 rounded-lg cursor-pointer" onClick={() => setSelectedDisease(alert.disease)} style={{ background: config.bg }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="icon-box-sm" style={{ background: config.bg }}>
                              {alert.alertLevel === 'normal' ? (
                                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" style={{ color: config.iconColor }} />
                              )}
                            </div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.disease}</span>
                          </div>
                          <span className={`badge badge-${alert.alertLevel} text-[10px]`}>
                            {alert.alertLevel.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          {alert.county}, {alert.state}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.cases}</span> cases
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-semibold" style={{ color: 'var(--taban-red)' }}>{alert.deaths}</span> deaths
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {alert.trend === 'increasing' ? (
                              <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-danger)' }} />
                            ) : alert.trend === 'decreasing' ? (
                              <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                            ) : (
                              <Minus className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
                            )}
                            <span className="text-[10px] font-medium" style={{
                              color: alert.trend === 'increasing' ? 'var(--color-danger)' : alert.trend === 'decreasing' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {alert.trend}
                            </span>
                          </div>
                        </div>
                        <hr className="section-divider" />
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Reported: {new Date(alert.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IDSR Weekly Report Summary */}
              <div className="card-elevated">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FileText className="w-4 h-4" style={{ color: 'var(--taban-blue)' }} />
                    IDSR Weekly Summary
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                    {reportingWeek}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          Disease
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          Cases
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          Prev
                        </th>
                        <th className="text-center text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          Trend
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          Deaths
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5"
                          style={{ color: 'var(--text-secondary)', background: 'var(--overlay-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                          CFR
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {idsrSummary.map((row, idx) => {
                        const change = row.casesThisWeek - row.casesPrevWeek;
                        const isUp = change > 0;
                        const isDown = change < 0;
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--table-row-border)' }}>
                              {row.disease}
                            </td>
                            <td className="px-3 py-2 text-xs text-right font-semibold" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--table-row-border)' }}>
                              {row.casesThisWeek.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-right" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--table-row-border)' }}>
                              {row.casesPrevWeek.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-center" style={{ borderBottom: '1px solid var(--table-row-border)' }}>
                              <div className="inline-flex items-center gap-0.5">
                                {isUp ? (
                                  <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-danger)' }} />
                                ) : isDown ? (
                                  <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                                ) : (
                                  <Minus className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
                                )}
                                <span className="text-[10px] font-medium" style={{
                                  color: isUp ? 'var(--color-danger)' : isDown ? 'var(--color-success)' : 'var(--color-warning)'
                                }}>
                                  {isUp ? '+' : ''}{change}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-right font-medium" style={{
                              color: row.deaths > 0 ? 'var(--taban-red)' : 'var(--text-muted)',
                              borderBottom: '1px solid var(--table-row-border)'
                            }}>
                              {row.deaths}
                            </td>
                            <td className="px-3 py-2 text-xs text-right" style={{
                              color: row.cfrPercent >= 10 ? 'var(--color-danger)' : row.cfrPercent >= 5 ? 'var(--color-warning)' : 'var(--text-secondary)',
                              fontWeight: row.cfrPercent >= 10 ? 600 : 400,
                              borderBottom: '1px solid var(--table-row-border)'
                            }}>
                              {(row.cfrPercent ?? 0).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--overlay-subtle)' }}>
                        <td className="px-3 py-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Total</td>
                        <td className="px-3 py-2 text-xs text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                          {idsrSummary.reduce((s, r) => s + r.casesThisWeek, 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-bold" style={{ color: 'var(--text-muted)' }}>
                          {idsrSummary.reduce((s, r) => s + r.casesPrevWeek, 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="inline-flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-danger)' }} />
                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-danger)' }}>
                              +{idsrSummary.reduce((s, r) => s + r.casesThisWeek, 0) - idsrSummary.reduce((s, r) => s + r.casesPrevWeek, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-bold" style={{ color: 'var(--taban-red)' }}>
                          {idsrSummary.reduce((s, r) => s + r.deaths, 0)}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {(() => {
                            const totalDeathsSum = idsrSummary.reduce((s, r) => s + r.deaths, 0);
                            const totalCasesSum = idsrSummary.reduce((s, r) => s + r.casesThisWeek, 0);
                            return totalCasesSum > 0 ? ((totalDeathsSum / totalCasesSum) * 100).toFixed(1) : '0.0';
                          })()}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <button className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--taban-blue)' }}>
                    <div className="icon-box-sm" style={{ background: 'rgba(43,111,224,0.12)' }}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    View Full IDSR Report
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Disease Alert Modal */}
          {showNewAlert && (
            <div className="modal-backdrop" onClick={() => !alertSubmitting && setShowNewAlert(false)}>
              <div className="modal-content card-elevated p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="icon-box-sm" style={{ background: 'rgba(229,46,66,0.12)' }}>
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <h3 className="text-base font-semibold">Report Disease Alert</h3>
                  </div>
                  <button onClick={() => setShowNewAlert(false)} className="p-1.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <hr className="section-divider" />
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Disease</label>
                    <select value={alertForm.disease} onChange={e => setAlertForm({ ...alertForm, disease: e.target.value })}>
                      <option value="">Select disease...</option>
                      {REPORTABLE_DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>State</label>
                      <select value={alertForm.state} onChange={e => setAlertForm({ ...alertForm, state: e.target.value })}>
                        <option value="">Select...</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>County</label>
                      <input type="text" value={alertForm.county} onChange={e => setAlertForm({ ...alertForm, county: e.target.value })} placeholder="County name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Suspected Cases</label>
                      <input type="number" min={0} value={alertForm.cases || ''} onChange={e => setAlertForm({ ...alertForm, cases: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Deaths</label>
                      <input type="number" min={0} value={alertForm.deaths || ''} onChange={e => setAlertForm({ ...alertForm, deaths: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Alert Level</label>
                      <select value={alertForm.alertLevel} onChange={e => setAlertForm({ ...alertForm, alertLevel: e.target.value as typeof alertForm.alertLevel })}>
                        <option value="watch">Watch</option>
                        <option value="warning">Warning</option>
                        <option value="emergency">Emergency</option>
                        <option value="normal">Normal (monitoring)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Trend</label>
                      <select value={alertForm.trend} onChange={e => setAlertForm({ ...alertForm, trend: e.target.value as typeof alertForm.trend })}>
                        <option value="increasing">Increasing</option>
                        <option value="stable">Stable</option>
                        <option value="decreasing">Decreasing</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setShowNewAlert(false)} className="btn btn-secondary flex-1" disabled={alertSubmitting}>Cancel</button>
                  <button onClick={handleCreateAlert} className="btn btn-primary flex-1" disabled={alertSubmitting}>
                    {alertSubmitting ? 'Submitting…' : 'Submit Alert'}
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>
    </>
  );
}
