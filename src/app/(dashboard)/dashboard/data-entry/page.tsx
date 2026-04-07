'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePatients } from '@/lib/hooks/usePatients';
import { useHospitals } from '@/lib/hooks/useHospitals';
import {
  Users, ClipboardCheck, Baby, Skull, Syringe, HeartPulse,
  Database, Building2, ArrowRight, CheckCircle2, AlertTriangle,
  Clock, FileText, Plus, Search, TrendingUp,
} from 'lucide-react';

const ACCENT = '#0891B2';

export default function DataEntryDashboard() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { patients } = usePatients();
  const { hospitals } = useHospitals();
  const [search, setSearch] = useState('');

  const myHospital = useMemo(() =>
    hospitals.find(h => h._id === currentUser?.hospitalId),
    [hospitals, currentUser?.hospitalId]
  );

  const myPatients = useMemo(() =>
    patients.filter(p =>
      p.registrationHospital === currentUser?.hospitalId ||
      p.lastVisitHospital === currentUser?.hospitalId
    ),
    [patients, currentUser?.hospitalId]
  );

  const recentPatients = useMemo(() => {
    const sorted = [...myPatients].sort((a, b) =>
      (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
    );
    if (!search.trim()) return sorted.slice(0, 15);
    const q = search.toLowerCase();
    return sorted.filter(p =>
      p.firstName?.toLowerCase().includes(q) ||
      p.surname?.toLowerCase().includes(q) ||
      p.hospitalNumber?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [myPatients, search]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayRegistrations = myPatients.filter(p =>
    (p.createdAt || '').slice(0, 10) === todayStr
  ).length;

  const todayUpdates = myPatients.filter(p =>
    (p.updatedAt || '').slice(0, 10) === todayStr &&
    (p.createdAt || '').slice(0, 10) !== todayStr
  ).length;

  const missingPhone = myPatients.filter(p => !p.phone || p.phone.trim() === '').length;
  const missingDOB = myPatients.filter(p => !p.dateOfBirth).length;
  const totalIncomplete = missingPhone + missingDOB;

  const quickActions = [
    { label: 'Register Patient', icon: Plus, href: '/patients/new', color: ACCENT },
    { label: 'Patient Registry', icon: Users, href: '/patients', color: '#0077D7' },
    { label: 'Facility Assessment', icon: ClipboardCheck, href: '/facility-assessments', color: '#7C3AED' },
    { label: 'Data Quality', icon: Database, href: '/data-quality', color: '#D97706' },
    { label: 'Immunizations', icon: Syringe, href: '/immunizations', color: '#059669' },
    { label: 'Antenatal Care', icon: HeartPulse, href: '/anc', color: '#EC4899' },
    { label: 'Births', icon: Baby, href: '/births', color: '#2563EB' },
    { label: 'Deaths', icon: Skull, href: '/deaths', color: '#DC2626' },
  ];

  const kpis = [
    { label: 'Total Patients', value: myPatients.length, icon: Users, color: ACCENT },
    { label: 'Registered Today', value: todayRegistrations, icon: Plus, color: '#059669' },
    { label: 'Updated Today', value: todayUpdates, icon: FileText, color: '#0077D7' },
    { label: 'Incomplete Records', value: totalIncomplete, icon: AlertTriangle, color: totalIncomplete > 0 ? '#D97706' : '#059669' },
  ];

  if (!currentUser) return null;

  return (
    <>
      <TopBar title="Data Entry Dashboard" />
      <main className="page-container page-enter">

        {/* Facility banner */}
        {myHospital && (
          <div className="card-elevated p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
              <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{myHospital.name}</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{myHospital.state} &middot; {myHospital.facilityType?.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: myHospital.syncStatus === 'online' ? '#4ADE80' : '#94A3B8' }} />
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{myHospital.syncStatus}</span>
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="kpi-grid mb-4">
          {kpis.map(k => (
            <div key={k.label} className="kpi">
              <div className="kpi__icon" style={{ background: `${k.color}15` }}>
                <k.icon style={{ color: k.color }} />
              </div>
              <div className="kpi__body">
                <div className="kpi__value">{k.value.toLocaleString()}</div>
                <div className="kpi__label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions grid */}
        <div className="card-elevated p-4 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all active:scale-95"
                style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${a.color}12` }}>
                  <a.icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <span className="text-[11px] font-semibold text-center" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Recent patients */}
          <div className="glass-section">
            <div className="glass-section-header">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Patient Records</span>
              </div>
              <button onClick={() => router.push('/patients')} className="text-[10px] font-semibold" style={{ color: ACCENT }}>View All</button>
            </div>
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-9 pr-3 py-2 rounded-md text-xs"
                  style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="space-y-1" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {recentPatients.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No patients found</p>
                ) : recentPatients.map(p => {
                  const hasIssue = !p.phone || !p.dateOfBirth;
                  return (
                    <div key={p._id} onClick={() => router.push(`/patients/${p._id}`)}
                      className="flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors"
                      style={{ border: '1px solid var(--border-light)' }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: hasIssue ? '#D9770615' : `${ACCENT}10` }}>
                        {hasIssue
                          ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
                          : <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {p.firstName} {p.surname}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {p.hospitalNumber} &middot; {p.gender} &middot; {p.dateOfBirth || 'No DOB'}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Data quality + stats */}
          <div className="flex flex-col gap-3">

            {/* Data completeness */}
            <div className="glass-section">
              <div className="glass-section-header">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" style={{ color: '#D97706' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Data Completeness</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Phone number recorded', total: myPatients.length, complete: myPatients.length - missingPhone, color: '#059669' },
                  { label: 'Date of birth recorded', total: myPatients.length, complete: myPatients.length - missingDOB, color: '#0077D7' },
                  { label: 'Blood type recorded', total: myPatients.length, complete: myPatients.filter(p => p.bloodType && p.bloodType !== '—').length, color: '#7C3AED' },
                  { label: 'Next of kin recorded', total: myPatients.length, complete: myPatients.filter(p => p.nokName).length, color: ACCENT },
                ].map(item => {
                  const pct = item.total > 0 ? Math.round((item.complete / item.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: pct === 100 ? '#059669' : pct >= 80 ? '#D97706' : '#DC2626' }}>
                          {pct}% ({item.complete}/{item.total})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'var(--overlay-medium)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's activity */}
            <div className="glass-section">
              <div className="glass-section-header">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#059669' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today&apos;s Activity</span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#059669' }}>{todayRegistrations}</div>
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>New Registrations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#0077D7' }}>{todayUpdates}</div>
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Records Updated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: ACCENT }}>{todayRegistrations + todayUpdates}</div>
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Entries</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facility summary */}
            {myHospital && (
              <div className="glass-section">
                <div className="glass-section-header">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Facility Summary</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Beds', value: myHospital.totalBeds },
                    { label: 'Doctors', value: myHospital.doctors },
                    { label: 'Nurses', value: myHospital.nurses },
                    { label: 'Clinical Officers', value: myHospital.clinicalOfficers },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-md" style={{ background: 'var(--overlay-subtle)' }}>
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                      <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
