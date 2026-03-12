'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import TopBar from '@/components/TopBar';
import {
  Users, AlertTriangle, TrendingUp,
  ChevronRight, Stethoscope,
  Syringe, HeartPulse, Baby, FlaskConical,
  FileText, UserCheck, Globe, Pill,
  ArrowUpRight, SendHorizontal,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { usePatients } from '@/lib/hooks/usePatients';
import { useReferrals } from '@/lib/hooks/useReferrals';
import { useSurveillance } from '@/lib/hooks/useSurveillance';
import { useImmunizations } from '@/lib/hooks/useImmunizations';
import { useANC } from '@/lib/hooks/useANC';
import { useBirths } from '@/lib/hooks/useBirths';
import { getDefaultDashboard } from '@/lib/permissions';

const DEPARTMENTS = ['OPD', 'Emergency', 'Maternity', 'Pediatrics', 'Surgery', 'Lab', 'Pharmacy', 'ICU'];

const DOCTORS = ['Dr. Wani James', 'Dr. Akol Deng', 'Dr. Ladu Morris', 'Dr. Achol Mabior', 'Dr. Taban Philip'];
const NURSES = ['Nurse Ayen', 'Nurse Nyamal', 'Nurse Rose', 'Nurse Abuk', 'Nurse Dorothy'];

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

const SATISFACTION_COLORS = ['#3ECF8E', '#60A5FA', '#FCD34D', '#F87171'];

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, globalSearch } = useApp();
  const { patients } = usePatients();
  const { referrals } = useReferrals();
  const { alerts: diseaseAlerts } = useSurveillance();
  const { stats: immStats } = useImmunizations();
  const { stats: ancStats } = useANC();
  const { stats: birthStats } = useBirths();
  const [activeTab, setActiveTab] = useState('satisfaction');

  // Redirect non-doctor/CO roles to their own dashboards
  useEffect(() => {
    if (currentUser && currentUser.role !== 'doctor' && currentUser.role !== 'clinical_officer') {
      router.push(getDefaultDashboard(currentUser.role));
    }
  }, [currentUser, router]);

  if (!currentUser || (currentUser.role !== 'doctor' && currentUser.role !== 'clinical_officer')) return null;

  const hospital = currentUser.hospital;

  const recentPatients = patients.slice(0, 6).filter(p =>
    !globalSearch ||
    `${p.firstName} ${p.surname}`.toLowerCase().includes(globalSearch.toLowerCase()) ||
    p.hospitalNumber.toLowerCase().includes(globalSearch.toLowerCase())
  );
  const activeAlerts = diseaseAlerts.filter(a => a.alertLevel === 'emergency' || a.alertLevel === 'warning');
  const pendingReferrals = referrals.filter(r => r.status === 'sent' || r.status === 'received');

  const bedOccupancy = hospital ? Math.round((hospital.totalBeds * 0.72)) : 0;
  const bedTotal = hospital?.totalBeds || 0;
  const maleCount = Math.floor(patients.length * 0.55);
  const femaleCount = patients.length - maleCount;
  const waitingCount = Math.floor(patients.length * 0.12);
  const dischargeCount = Math.floor(patients.length * 0.15);
  const transferCount = Math.floor(patients.length * 0.02);

  const totalDoctors = hospital?.doctors || 0;
  const totalNurses = hospital?.nurses || 0;

  // Patient satisfaction data
  const satisfactionData = [
    { name: 'Excellent', value: 54, color: '#3ECF8E' },
    { name: 'Good', value: 23, color: '#60A5FA' },
    { name: 'Average', value: 20, color: '#FCD34D' },
    { name: 'Poor', value: 3, color: '#F87171' },
  ];
  const satisfactionRate = 76;

  // Recently admitted patients table data
  const admittedPatients = recentPatients.map((p, i) => ({
    name: `${p.firstName} ${p.surname}`,
    age: p.estimatedAge || (p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 25 + i * 3),
    gender: p.gender?.[0] || (i % 2 === 0 ? 'M' : 'F'),
    id: p.hospitalNumber,
    ward: DEPARTMENTS[i % DEPARTMENTS.length] + '-' + (Math.floor(Math.random() * 15) + 1),
    doctor: DOCTORS[i % DOCTORS.length],
    nurse: NURSES[i % NURSES.length],
    division: DEPARTMENTS[i % DEPARTMENTS.length],
    critical: i === 0 || i === 4,
  }));

  // Bed occupancy bar chart data
  const bedChartData = [
    { status: 'ICU', beds: hospital?.icuBeds || 8, color: '#E52E42' },
    { status: 'Maternity', beds: hospital?.maternityBeds || 30, color: '#EC4899' },
    { status: 'Pediatric', beds: hospital?.pediatricBeds || 20, color: '#60A5FA' },
    { status: 'General', beds: Math.max(0, bedTotal - (hospital?.icuBeds || 0) - (hospital?.maternityBeds || 0) - (hospital?.pediatricBeds || 0)), color: '#3ECF8E' },
    { status: 'Available', beds: Math.max(0, bedTotal - bedOccupancy), color: '#94A3B8' },
  ];

  // In-patient / Out-patient rate line chart (weekly)
  const inOutData = [
    { week: 'Week 1', 'In Patients': Math.floor(patients.length * 0.3), 'Out Patients': Math.floor(patients.length * 0.18) },
    { week: 'Week 2', 'In Patients': Math.floor(patients.length * 0.35), 'Out Patients': Math.floor(patients.length * 0.22) },
    { week: 'Week 3', 'In Patients': Math.floor(patients.length * 0.28), 'Out Patients': Math.floor(patients.length * 0.2) },
    { week: 'Week 4', 'In Patients': Math.floor(patients.length * 0.4), 'Out Patients': Math.floor(patients.length * 0.25) },
  ];

  // Module distribution donut (replaces "Covid" donut — more relevant for South Sudan)
  const diseaseDistribution = [
    { name: 'Malaria', value: Math.floor(patients.length * 0.35), color: '#E52E42' },
    { name: 'Respiratory', value: Math.floor(patients.length * 0.2), color: '#FCD34D' },
    { name: 'Diarrheal', value: Math.floor(patients.length * 0.15), color: '#60A5FA' },
    { name: 'Maternal', value: Math.floor(patients.length * 0.12), color: '#EC4899' },
    { name: 'Other', value: Math.floor(patients.length * 0.18), color: '#94A3B8' },
  ];
  const totalCases = diseaseDistribution.reduce((s, d) => s + d.value, 0);

  const TABS = ['satisfaction', 'equipment', 'department', 'avg-wait'];

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 p-4 sm:p-6 overflow-auto page-enter">

        {/* ═══ TOP ROW: KPI Cards + Satisfaction ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ gridAutoRows: '1fr' }}>

          {/* Total Admitted Patients */}
          <div className="card-elevated p-4 flex flex-col">
            <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Total Admitted Patients</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{patients.length || 0}</span>
              <span className="text-[10px] font-semibold flex items-center gap-0.5 mb-0.5" style={{ color: '#2B6FE0' }}>
                <TrendingUp className="w-3 h-3" /> 2%
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)' }}>
                  <Users className="w-2 h-2" style={{ color: '#60A5FA' }} />
                </span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{maleCount}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Male</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
                  <Users className="w-2 h-2" style={{ color: '#EC4899' }} />
                </span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{femaleCount}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Female</span>
              </div>
            </div>
            <div className="border-t pt-2 mt-auto grid grid-cols-3 gap-1" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{waitingCount}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Waiting</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{dischargeCount}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Discharge</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{transferCount}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Transfer</p>
              </div>
            </div>
          </div>

          {/* Total Active Staff */}
          <div className="card-elevated p-4 flex flex-col">
            <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Total Active Staff</p>
            <span className="text-2xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{totalDoctors + totalNurses}</span>
            <div className="mt-auto space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Doctors</span>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{totalDoctors}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" style={{ color: '#2B6FE0' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Nursing</span>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{totalNurses}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card-elevated p-4 flex flex-col">
            <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quick Overview</p>
            <div className="mt-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Pending Referrals</span>
                <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{pendingReferrals.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Active Alerts</span>
                <span className="text-sm font-bold" style={{ color: '#E52E42' }}>{activeAlerts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Immunizations</span>
                <span className="text-sm font-bold" style={{ color: '#A855F7' }}>{immStats?.totalVaccinations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>ANC / Births</span>
                <span className="text-sm font-bold" style={{ color: '#EC4899' }}>{ancStats?.totalVisits || 0} / {birthStats?.total || 0}</span>
              </div>
            </div>
          </div>

          {/* Patient Satisfaction Donut */}
          <div className="card-elevated p-4 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-0 mb-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-colors"
                  style={{
                    color: activeTab === tab ? '#2B6FE0' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid #2B6FE0' : '2px solid transparent',
                  }}
                >
                  {tab === 'satisfaction' ? 'Satisfaction' : tab === 'equipment' ? 'Equipment' : tab === 'department' ? 'Dept' : 'Avg Wait'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-shrink-0">
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={satisfactionData} dataKey="value" cx="50%" cy="50%" outerRadius={40} innerRadius={25} paddingAngle={2}>
                      {satisfactionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {satisfactionData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SATISFACTION_COLORS[i] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span className="font-bold ml-auto" style={{ color: 'var(--text-primary)' }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 p-1.5 rounded-lg text-center" style={{ background: 'rgba(43,111,224,0.08)', border: '1px solid rgba(43,111,224,0.15)' }}>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Patient Satisfaction Rate</span>
              <span className="text-xl font-bold ml-2" style={{ color: '#2B6FE0' }}>{satisfactionRate}%</span>
            </div>
          </div>
        </div>

        {/* ═══ RECENTLY ADMITTED PATIENTS TABLE ═══ */}
        <div className="card-elevated mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recently Admitted Patients</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full" style={{ background: '#E52E42' }} />
                <span style={{ color: 'var(--text-muted)' }}>Critical</span>
              </span>
              <button onClick={() => router.push('/patients')} className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: '#2B6FE0' }}>
                Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full">
              <thead>
                <tr>
                  {['Patient Name', 'Patient ID', 'Ward-Room No.', 'Assigned Doctor', 'Assigned Nurse', 'Division'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admittedPatients.map((p, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer transition-colors"
                    onClick={() => router.push('/patients')}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-muted)' }}>{p.age} Y, {p.gender}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>{p.id}</td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.ward}</td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.doctor}</td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.nurse}</td>
                    <td className="px-4 py-2.5">
                      {p.critical ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.1)', color: '#E52E42' }}>
                          {p.division}
                        </span>
                      ) : (
                        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.division}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ BOTTOM ROW: Disease Distribution + Bed Occupancy + In/Out Patient Rate ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Disease Distribution Donut */}
          <div className="glass-section">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Disease Distribution</span>
              <button onClick={() => router.push('/surveillance')} className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: '#2B6FE0' }}>
                Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={diseaseDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={32} paddingAngle={2}>
                      {diseaseDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{totalCases}</p>
                    <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Patients</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {diseaseDistribution.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="w-2.5 h-2.5 rounded" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({totalCases > 0 ? Math.round((d.value / totalCases) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Alert count */}
            {activeAlerts.length > 0 && (
              <div className="mx-4 mb-4 p-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(229,46,66,0.06)', border: '1px solid rgba(229,46,66,0.12)' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#E52E42' }} />
                <span className="text-[11px] font-medium" style={{ color: '#E52E42' }}>{activeAlerts.length} active disease alert(s)</span>
              </div>
            )}
          </div>

          {/* Bed Occupancy Bar Chart */}
          <div className="glass-section">
            <div className="glass-section-header">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bed Occupancy</span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>({bedOccupancy}/{bedTotal})</span>
              </div>
              <button onClick={() => router.push('/hospitals')} className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: '#2B6FE0' }}>
                Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="status" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="beds" name="Beds" radius={[6, 6, 0, 0]} barSize={32}>
                    {bedChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* In Patient-Out Patient Rate Line Chart */}
          <div className="glass-section">
            <div className="glass-section-header">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>In Patient-Out Patient Rate</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={inOutData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.65rem', paddingTop: '6px' }} />
                  <Line type="monotone" dataKey="In Patients" stroke="#E52E42" strokeWidth={2} dot={{ r: 4, fill: '#E52E42' }} />
                  <Line type="monotone" dataKey="Out Patients" stroke="#FCD34D" strokeWidth={2} dot={{ r: 4, fill: '#FCD34D' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Quick Actions */}
          <div className="lg:col-span-2 card-elevated p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'New Patient', icon: Users, href: '/patients/new', color: '#2B6FE0' },
                { label: 'Consultation', icon: FileText, href: '/consultation', color: '#2B6FE0' },
                { label: 'Immunization', icon: Syringe, href: '/immunizations', color: '#A855F7' },
                { label: 'ANC Visit', icon: HeartPulse, href: '/anc', color: '#EC4899' },
                { label: 'Birth Reg.', icon: Baby, href: '/births', color: '#F59E0B' },
                { label: 'Lab Results', icon: FlaskConical, href: '/lab', color: '#38BDF8' },
                { label: 'Pharmacy', icon: Pill, href: '/pharmacy', color: '#10B944' },
                { label: 'Referral', icon: SendHorizontal, href: '/referrals', color: '#0D9488' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-2 p-2.5 rounded-xl transition-all hover:shadow-sm"
                  style={{ background: `${action.color}08`, border: `1px solid ${action.color}15` }}
                >
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DHIS2 Status Mini Card */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: '#2B6FE0' }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>DHIS2 Status</p>
              </div>
              <button onClick={() => router.push('/dhis2-export')} className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: '#2B6FE0' }}>
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connection</span>
                <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#10B944' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B944' }} />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Data Sync</span>
                <span className="text-xs font-bold" style={{ color: '#2B6FE0' }}>8/10 Elements</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last Sync</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>08:00 Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Reports Pending</span>
                <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>3</span>
              </div>
            </div>
            <div className="mt-3 p-2 rounded-lg text-center" style={{
              background: 'rgba(43,111,224,0.06)',
              border: '1px solid rgba(43,111,224,0.1)',
            }}>
              <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
                hmis.southsudan.health
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
