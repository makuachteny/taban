'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  User, Calendar, FileText, FlaskConical, Syringe,
  HeartPulse, Shield, Pill, Scan, FolderOpen,
  ChevronRight, AlertTriangle, Eye, EyeOff,
  MessageSquare, ArrowRight, Activity,
  Plus, X, LogOut, Send, Building2,
} from 'lucide-react';
import type { PatientDoc, AppointmentDoc, LabResultDoc, MedicalRecordDoc } from '@/lib/db-types';

type Tab = 'overview' | 'appointments' | 'records' | 'lab' | 'prescriptions' | 'radiology' | 'documents' | 'immunizations' | 'messages' | 'chat';

/* ═════════════════════════════════════════
   PATIENT LOGIN SCREEN
   ═════════════════════════════════════════ */
function PatientLogin({ onLogin }: { onLogin: (patient: PatientDoc) => void }) {
  const [mode, setMode] = useState<'login' | 'lookup'>('login');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { isSeeded } = await import('@/lib/db');
        const seeded = await isSeeded();
        if (!seeded) {
          const { seedDatabase } = await import('@/lib/db-seed');
          await seedDatabase();
        }
        setDbReady(true);
      } catch { setDbReady(false); }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbReady) { setError('Database is still loading. Please wait a moment and try again.'); return; }
    setError(''); setLoading(true);
    try {
      const { getAllPatients } = await import('@/lib/services/patient-service');
      const patients = await getAllPatients();
      let found: PatientDoc | undefined;

      if (mode === 'login') {
        // Match by hospital number + phone
        const hnum = hospitalNumber.trim().toUpperCase();
        const ph = phoneNumber.trim().replace(/\s/g, '');
        found = patients.find(p => {
          const pPhone = (p.phone || '').replace(/\s/g, '');
          return (p.hospitalNumber?.toUpperCase() === hnum || p.geocodeId?.toUpperCase() === hnum) &&
            (pPhone === ph || pPhone.endsWith(ph.slice(-6)));
        });
      } else {
        // Lookup by name + DOB
        const fn = firstName.trim().toLowerCase();
        const sn = surname.trim().toLowerCase();
        found = patients.find(p =>
          p.firstName.toLowerCase() === fn &&
          p.surname.toLowerCase() === sn &&
          (dateOfBirth ? p.dateOfBirth === dateOfBirth : true)
        );
      }

      if (found) {
        localStorage.setItem('taban-patient-id', found._id);
        localStorage.setItem('taban-patient-name', `${found.firstName} ${found.surname}`);
        onLogin(found);
      } else {
        setError(mode === 'login'
          ? 'No patient found with this Hospital ID and phone number. Check your details and try again.'
          : 'No patient found with this name. Please verify your details or contact your facility.'
        );
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
      console.error(err);
    } finally { setLoading(false); }
  };

  const BLUE = '#0077D7';
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1px solid var(--border-medium)', borderRadius: 4,
    background: 'var(--bg-card-solid)', color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 6,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center justify-center px-6 py-10 relative">

        {/* Logo — matching staff login */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/taban-logo.svg" alt="TABAN" className="w-16 h-16" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[0.12em]" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>TABAN</h1>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase mt-1" style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            Republic of South Sudan · Patient Portal
          </p>
          {/* South Sudan flag stripe */}
          <div className="flex items-center justify-center gap-0 mt-3">
            <div className="h-[3px] w-8 rounded-l-full" style={{ background: '#111' }} />
            <div className="h-[3px] w-8" style={{ background: '#E52E42' }} />
            <div className="h-[3px] w-4" style={{ background: '#fff', border: '0.5px solid var(--border-medium)' }} />
            <div className="h-[3px] w-8" style={{ background: '#10B944' }} />
            <div className="h-[3px] w-4" style={{ background: '#0F4C81' }} />
            <div className="h-[3px] w-2 rounded-r-full" style={{ background: '#FCD34D' }} />
          </div>
        </div>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="p-8 sm:p-10" style={{
            background: 'var(--bg-card-solid)', borderRadius: '6px',
            border: '1px solid var(--border-medium)', boxShadow: 'var(--card-shadow)',
          }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>Patient Sign In</h2>
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>Access your health records securely</p>

            {!dbReady && (
              <div className="mb-4 p-3 rounded-lg text-center" style={{
                background: 'rgba(43,111,224,0.08)', border: '1px solid rgba(43,111,224,0.15)',
              }}>
                <p className="text-xs" style={{ color: BLUE }}>
                  <svg className="animate-spin w-3 h-3 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Initializing offline database...
                </p>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex mb-6 rounded overflow-hidden" style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)' }}>
              <button onClick={() => { setMode('login'); setError(''); }} type="button" className="flex-1 py-3 text-sm font-bold transition-all" style={{
                background: mode === 'login' ? BLUE : 'transparent',
                color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', borderRadius: 3, margin: 2,
              }}>Hospital ID</button>
              <button onClick={() => { setMode('lookup'); setError(''); }} type="button" className="flex-1 py-3 text-sm font-bold transition-all" style={{
                background: mode === 'lookup' ? BLUE : 'transparent',
                color: mode === 'lookup' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', borderRadius: 3, margin: 2,
              }}>Name Lookup</button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {mode === 'login' ? (
                <>
                  <div>
                    <label htmlFor="pp-hospital" style={labelStyle}>Hospital Number or Geocode ID</label>
                    <input id="pp-hospital" type="text" value={hospitalNumber} onChange={e => setHospitalNumber(e.target.value)}
                      placeholder="e.g. JTH-000001" required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,119,215,0.1)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }} />
                  </div>
                  <div>
                    <label htmlFor="pp-phone" style={labelStyle}>Phone Number</label>
                    <input id="pp-phone" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +211 912 345 678" required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,119,215,0.1)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="pp-firstName" style={labelStyle}>First Name</label>
                    <input id="pp-firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Your first name" required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,119,215,0.1)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }} />
                  </div>
                  <div>
                    <label htmlFor="pp-surname" style={labelStyle}>Surname</label>
                    <input id="pp-surname" type="text" value={surname} onChange={e => setSurname(e.target.value)}
                      placeholder="Your surname" required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,119,215,0.1)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }} />
                  </div>
                  <div>
                    <label htmlFor="pp-dob" style={labelStyle}>Date of Birth (optional)</label>
                    <input id="pp-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,119,215,0.1)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }} />
                  </div>
                </>
              )}

              {error && (
                <div role="alert" className="p-3 rounded-xl text-sm" style={{
                  background: 'rgba(229,46,66,0.06)', color: '#E52E42',
                  border: '1px solid rgba(229,46,66,0.15)',
                }}>{error}</div>
              )}

              <button type="submit" disabled={loading || !dbReady}
                className="w-full flex items-center justify-center gap-2 text-[15px] font-semibold text-white transition-all duration-200 mt-3"
                style={{
                  fontFamily: "'Inter', 'DM Sans', sans-serif",
                  background: BLUE, padding: '14px 20px', borderRadius: 4,
                  border: 'none', cursor: loading ? 'wait' : 'pointer',
                  opacity: loading || !dbReady ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(0,119,215,0.25)',
                }}>
                {loading ? 'Searching...' : 'Patient Sign In'} <ArrowRight size={14} />
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border-medium)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Demo Accounts</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'JTH-000001', phone: '0912345678', name: 'Deng Mabior Garang' },
                  { id: 'JTH-000002', phone: '0916111222', name: 'Nyabol Gatdet Koang' },
                  { id: 'JTH-000003', phone: '0921333444', name: 'Achol Mayen Deng' },
                ].map(demo => (
                  <button key={demo.id} type="button" onClick={() => { setMode('login'); setHospitalNumber(demo.id); setPhoneNumber(demo.phone); setError(''); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all"
                    style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{demo.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{demo.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   PATIENT PORTAL (authenticated)
   ═════════════════════════════════════════ */
export default function PatientPortalPage() {
  const [patient, setPatient] = useState<PatientDoc | null>(null);
  const [checking, setChecking] = useState(true);

  // Check for existing session
  useEffect(() => {
    const savedId = localStorage.getItem('taban-patient-id');
    if (savedId) {
      (async () => {
        try {
          const { getAllPatients } = await import('@/lib/services/patient-service');
          const patients = await getAllPatients();
          const found = patients.find(p => p._id === savedId);
          if (found) setPatient(found);
        } catch { /* ignore */ }
        finally { setChecking(false); }
      })();
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('taban-patient-id');
    localStorage.removeItem('taban-patient-name');
    setPatient(null);
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!patient) {
    return <PatientLogin onLogin={setPatient} />;
  }

  return <PatientDashboard patient={patient} onLogout={handleLogout} />;
}

/* ═════════════════════════════════════════
   PATIENT DASHBOARD
   ═════════════════════════════════════════ */
function PatientDashboard({ patient, onLogout }: { patient: PatientDoc; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [labResults, setLabResults] = useState<LabResultDoc[]>([]);
  const [records, setRecords] = useState<MedicalRecordDoc[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  // Load patient-specific data
  useEffect(() => {
    (async () => {
      try {
        const [aptMod, labMod, recMod] = await Promise.all([
          import('@/lib/services/appointment-service'),
          import('@/lib/services/lab-service'),
          import('@/lib/services/medical-record-service'),
        ]);
        const [apts, labs, recs] = await Promise.all([
          aptMod.getAppointmentsByPatient(patient._id),
          labMod.getLabResultsByPatient(patient._id),
          recMod.getRecordsByPatient(patient._id),
        ]);
        setAppointments(apts);
        setLabResults(labs);
        setRecords(recs);
      } catch (err) { console.error('Failed to load patient data:', err); }
    })();
  }, [patient._id]);

  const upcomingApts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.filter(a => a.appointmentDate >= today && a.status !== 'cancelled' && a.status !== 'no_show');
  }, [appointments]);

  const [chatDepartment, setChatDepartment] = useState('General / OPD');

  const mainTabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'records', label: 'Medical Records', icon: FileText, count: records.length },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { key: 'lab', label: 'Lab Results', icon: FlaskConical, count: labResults.filter(l => l.status === 'pending').length },
    { key: 'radiology', label: 'Radiology & Imaging', icon: Scan },
    { key: 'documents', label: 'Documents', icon: FolderOpen },
    { key: 'immunizations', label: 'Immunizations', icon: Syringe },
  ];
  const actionTabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'appointments', label: 'Appointments', icon: Calendar, count: upcomingApts.length },
    { key: 'chat', label: 'Messages', icon: MessageSquare },
  ];
  const tabs = [...mainTabs, ...actionTabs];

  const [chatMessages, setChatMessages] = useState<{ text: string; from: 'patient' | 'system'; time: string }[]>([
    { text: `Welcome ${patient.firstName}! How can we help you today?`, from: 'system', time: '09:00' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { text: chatInput, from: 'patient', time }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        text: 'Thank you for your message. A healthcare provider at your facility will respond shortly.',
        from: 'system',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)' }}>
      <style dangerouslySetInnerHTML={{ __html: patientPortalCSS }} />

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex" style={{
        width: 260, flexShrink: 0, flexDirection: 'column',
        background: 'var(--bg-card-solid)', borderRight: '1px solid var(--border-medium)',
      }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {patient.photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={patient.photoUrl} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                : <User size={22} style={{ color: 'var(--accent-primary)' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{patient.firstName} {patient.surname}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patient.hospitalNumber}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', marginBottom: 10 }}>
            <Building2 size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{patient.registrationHospital}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {/* Health records section */}
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '8px 14px 4px', opacity: 0.7 }}>Health Records</p>
          {mainTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, textAlign: 'left', marginBottom: 1,
              transition: 'all 0.15s ease',
            }}>
              <tab.icon size={15} />
              <span style={{ flex: 1 }}>{tab.label}</span>
              {tab.count ? <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--accent-light)',
                color: activeTab === tab.key ? '#fff' : 'var(--accent-primary)',
              }}>{tab.count}</span> : null}
            </button>
          ))}

          {/* Communication section */}
          <div style={{ height: 1, background: 'var(--border-medium)', margin: '10px 14px' }} />
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 14px 4px', opacity: 0.7 }}>Communication</p>
          {actionTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, textAlign: 'left', marginBottom: 1,
              transition: 'all 0.15s ease',
            }}>
              <tab.icon size={15} />
              <span style={{ flex: 1 }}>{tab.label}</span>
              {tab.count ? <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--accent-light)',
                color: activeTab === tab.key ? '#fff' : 'var(--accent-primary)',
              }}>{tab.count}</span> : null}
            </button>
          ))}
        </nav>

        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-medium)' }}>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, textAlign: 'left',
          }}><LogOut size={15} /> Sign Out</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 52px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

          {/* Mobile header */}
          <div className="md:hidden" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{patient.firstName} {patient.surname}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patient.hospitalNumber}</p>
              </div>
              <button onClick={() => setActiveTab('chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 6 }}><MessageSquare size={18} /></button>
              <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}><LogOut size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
                  borderRadius: 8, border: activeTab === tab.key ? 'none' : '1px solid var(--border-medium)', cursor: 'pointer',
                  background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--bg-card-solid)',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat Panel ── */}
      {/* ═══ Chat / Messages ═══ */}
      {activeTab === 'chat' && (
        <div>
          {/* Hospital & department selector */}
          <div className="card-elevated" style={{ padding: 16, marginBottom: 16, borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Hospital</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)' }}>
                  <Building2 size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{patient.registrationHospital}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Department</label>
                <select value={chatDepartment} onChange={e => setChatDepartment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                  {['General / OPD', 'Internal Medicine', 'Obstetrics', 'Pediatrics', 'Surgery', 'Laboratory', 'Pharmacy', 'Dental', 'Emergency'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="card-elevated" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{chatDepartment}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>&middot; {patient.registrationHospital}</span>
            </div>
            <div style={{ height: 380, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'patient' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
                    background: msg.from === 'patient' ? 'var(--accent-primary)' : 'var(--overlay-subtle)',
                    color: msg.from === 'patient' ? '#fff' : 'var(--text-primary)',
                    fontSize: 13, lineHeight: 1.5,
                    borderBottomRightRadius: msg.from === 'patient' ? 4 : 12,
                    borderBottomLeftRadius: msg.from === 'system' ? 4 : 12,
                  }}>
                    <p>{msg.text}</p>
                    <p style={{ fontSize: 9, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-medium)', display: 'flex', gap: 8 }}>
              <input
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder={`Message ${chatDepartment}...`}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-medium)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
              <button onClick={handleSendChat} style={{
                padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center',
              }}><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Overview ═══ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {/* Profile */}
          <div className="card-elevated" style={{ padding: 18 }}>
            <SH icon={User} title="Personal Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <Info label="Full Name" value={`${patient.firstName} ${patient.middleName || ''} ${patient.surname}`} />
              <Info label="Date of Birth" value={patient.dateOfBirth || `~${patient.estimatedAge} years`} />
              <Info label="Gender" value={patient.gender} />
              <Info label="Blood Type" value={patient.bloodType || '—'} />
              <Info label="Phone" value={patient.phone || '—'} />
              <Info label="Geocode ID" value={patient.geocodeId || '—'} />
              <Info label="Location" value={`${patient.county || ''}, ${patient.state}`} />
              <Info label="Facility" value={patient.registrationHospital} />
            </div>
          </div>

          {/* Next appointment + alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Next appointment */}
            <div className="card-elevated" style={{ padding: 18 }}>
              <SH icon={Calendar} title="Next Appointment" />
              {upcomingApts.length > 0 ? (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 'var(--card-radius)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
                  <div className="stat-value" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>
                    {upcomingApts[0].appointmentDate} at {upcomingApts[0].appointmentTime}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{upcomingApts[0].reason}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Dr. {upcomingApts[0].providerName} &middot; {upcomingApts[0].department}</div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>No upcoming appointments.
                  <button onClick={() => setShowBooking(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>Book one</button>
                </p>
              )}
            </div>

            {/* Health alerts */}
            <div className="card-elevated" style={{ padding: 18 }}>
              <SH icon={AlertTriangle} title="Health Alerts" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {(patient.allergies || []).length > 0 && (
                  <AlertRow color="#EF4444" icon={AlertTriangle} text={`Allergies: ${patient.allergies.join(', ')}`} />
                )}
                {(patient.chronicConditions || []).map((c, i) => (
                  <AlertRow key={i} color="#D97706" icon={HeartPulse} text={c} />
                ))}
                {labResults.filter(l => l.status === 'pending').length > 0 && (
                  <AlertRow color="var(--accent-primary)" icon={FlaskConical} text={`${labResults.filter(l => l.status === 'pending').length} pending lab result(s)`} />
                )}
                {(patient.allergies || []).length === 0 && (patient.chronicConditions || []).length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No health alerts</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Appointments ═══ */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Your Appointments ({appointments.length})</h2>
            <button onClick={() => setShowBooking(true)} className="btn btn-primary btn-sm" style={{ gap: 4 }}><Plus size={13} /> Book New</button>
          </div>
          {appointments.length === 0 ? (
            <Empty icon={Calendar} text="No appointments yet" action="Book Appointment" onAction={() => setShowBooking(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appointments.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate)).map(apt => {
                const isPast = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';
                return (
                  <div key={apt._id} className="card-elevated" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `3px solid ${isPast ? 'var(--border-medium)' : 'var(--accent-primary)'}` }}>
                    <div style={{ minWidth: 48, textAlign: 'center' }}>
                      <div className="stat-value" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{apt.appointmentTime}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{apt.appointmentDate}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{apt.reason || apt.appointmentType}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dr. {apt.providerName} &middot; {apt.department}</div>
                    </div>
                    <Badge text={apt.status.replace('_', ' ')} color={isPast ? 'var(--text-muted)' : apt.status === 'confirmed' ? 'var(--color-success)' : 'var(--accent-primary)'} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Records ═══ */}
      {activeTab === 'records' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Medical Records ({records.length})</h2>
          {records.length === 0 ? (
            <Empty icon={FileText} text="No medical records found" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(rec => (
                <div key={rec._id} className="card-elevated" style={{ overflow: 'hidden' }}>
                  <button onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ minWidth: 70, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{rec.createdAt?.slice(0, 10)}</div>
                    <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {(rec as unknown as Record<string, unknown>).visitType as string || 'Consultation'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {((rec as unknown as Record<string, unknown>).diagnoses as Array<{name: string}> || []).map(d => d.name).join(', ') || 'No diagnosis recorded'}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: expandedId === rec._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {expandedId === rec._id && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border-medium)', paddingTop: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                        {((rec as unknown as Record<string, unknown>).vitalSigns as Record<string, unknown>) && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Vital Signs</div>
                            {Object.entries((rec as unknown as Record<string, unknown>).vitalSigns as Record<string, unknown>).filter(([, v]) => v).map(([k, v]) => (
                              <div key={k} style={{ fontSize: 12, color: 'var(--text-primary)' }}>{k}: <strong>{String(v)}</strong></div>
                            ))}
                          </div>
                        )}
                        {((rec as unknown as Record<string, unknown>).prescriptions as Array<{medication: string; dosage: string}> || []).length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Prescriptions</div>
                            {((rec as unknown as Record<string, unknown>).prescriptions as Array<{medication: string; dosage: string}>).map((rx, i) => (
                              <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)' }}>{rx.medication} — {rx.dosage}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Lab Results ═══ */}
      {activeTab === 'lab' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Lab Results ({labResults.length})</h2>
          {labResults.length === 0 ? (
            <Empty icon={FlaskConical} text="No lab results found" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {labResults.sort((a, b) => (b.orderedAt || b.createdAt).localeCompare(a.orderedAt || a.createdAt)).map(lab => (
                <div key={lab._id} className="card-elevated" style={{ overflow: 'hidden' }}>
                  <button onClick={() => setExpandedId(expandedId === lab._id ? null : lab._id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ minWidth: 70, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{(lab.orderedAt || lab.createdAt).slice(0, 10)}</div>
                    <FlaskConical size={14} style={{ color: lab.status === 'pending' ? 'var(--color-warning)' : lab.abnormal ? 'var(--color-danger)' : 'var(--color-success)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lab.testName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lab.specimen} &middot; {lab.orderedBy}</div>
                    </div>
                    <Badge text={lab.status === 'completed' ? (lab.abnormal ? 'Abnormal' : 'Normal') : lab.status}
                      color={lab.status === 'pending' ? 'var(--color-warning)' : lab.abnormal ? 'var(--color-danger)' : 'var(--color-success)'} />
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: expandedId === lab._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {expandedId === lab._id && lab.status === 'completed' && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border-medium)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--card-radius)', background: lab.abnormal ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)' }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Result</div>
                          <div className="stat-value" style={{ fontSize: 15, fontWeight: 700, color: lab.abnormal ? 'var(--color-danger)' : 'var(--text-primary)' }}>{lab.result}</div>
                        </div>
                        {lab.referenceRange && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lab.referenceRange} {lab.unit}</div>
                          </div>
                        )}
                      </div>
                      {lab.critical && (
                        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 'var(--card-radius)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={12} style={{ color: 'var(--color-danger)' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-danger)' }}>Critical result — contact your provider immediately</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Prescriptions ═══ */}
      {activeTab === 'prescriptions' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Prescriptions</h2>
          {records.length === 0 ? (
            <Empty icon={Pill} text="No prescriptions found" />
          ) : (() => {
            const allRx = records.flatMap(rec => {
              const rxList = (rec as unknown as Record<string, unknown>).prescriptions as Array<{ medication: string; dosage: string; frequency?: string; duration?: string }> || [];
              return rxList.map(rx => ({ ...rx, date: rec.createdAt?.slice(0, 10) || '', recordId: rec._id }));
            }).sort((a, b) => b.date.localeCompare(a.date));
            return allRx.length === 0 ? (
              <Empty icon={Pill} text="No prescriptions recorded yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allRx.map((rx, i) => (
                  <div key={i} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid var(--accent-primary)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Pill size={16} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{rx.medication}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rx.dosage}{rx.frequency ? ` · ${rx.frequency}` : ''}{rx.duration ? ` · ${rx.duration}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{rx.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ Radiology & Imaging ═══ */}
      {activeTab === 'radiology' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Radiology & Imaging</h2>
          {/* Mock radiology data from lab results that are imaging-related, or show placeholder */}
          {(() => {
            const imagingTests = labResults.filter(l =>
              /x-ray|xray|mri|ct scan|ultrasound|radiology|imaging|echo|mammogram/i.test(l.testName || '')
            );
            return imagingTests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {imagingTests.map(img => (
                  <div key={img._id} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Scan size={16} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{img.testName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(img.orderedAt || img.createdAt).slice(0, 10)} · {img.orderedBy}</div>
                    </div>
                    <Badge text={img.status} color={img.status === 'pending' ? 'var(--color-warning)' : 'var(--accent-primary)'} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Empty icon={Scan} text="No imaging results available" />
                <div className="card-elevated" style={{ padding: 18, marginTop: 14 }}>
                  <SH icon={Scan} title="Available Imaging Services" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    {['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Echocardiogram', 'Mammogram'].map(svc => (
                      <div key={svc} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scan size={13} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{svc}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                    Imaging results will appear here once ordered by your doctor. Contact your facility to schedule imaging.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ Documents ═══ */}
      {activeTab === 'documents' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Documents</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Generate document entries from existing data */}
            {records.length > 0 && (
              <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setActiveTab('records')}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Medical Records</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{records.length} consultation record{records.length !== 1 ? 's' : ''}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
            {labResults.length > 0 && (
              <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setActiveTab('lab')}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FlaskConical size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Lab Reports</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{labResults.length} lab result{labResults.length !== 1 ? 's' : ''}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
            {/* Discharge summaries */}
            <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--overlay-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FolderOpen size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Discharge Summaries</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available after inpatient discharge</div>
              </div>
            </div>
            {/* Referral letters */}
            <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--overlay-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Referral Letters</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Generated when referred to another facility</div>
              </div>
            </div>
            {/* Insurance / ID docs */}
            <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--overlay-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Insurance & ID Documents</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload insurance cards and identification</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Immunizations ═══ */}
      {activeTab === 'immunizations' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Immunization Record</h2>
          <Empty icon={Syringe} text="Immunization data is loaded from the facility system. Visit your nearest health center to view or update your vaccination record." />
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowBooking(false); }}>
          <div className="modal-panel modal-panel--md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Request Appointment</h3>
              <button onClick={() => setShowBooking(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--overlay-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>Submit a request and the facility will confirm within 24 hours.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--accent-light)', border: '1px solid var(--accent-border)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Booking at: {patient.registrationHospital}</span>
              </div>
              <div><label>Preferred Date</label><input type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div><label>Preferred Time</label>
                <select><option>Morning (8:00-12:00)</option><option>Afternoon (12:00-16:00)</option><option>Any time</option></select>
              </div>
              <div><label>Department</label>
                <select><option>General / OPD</option><option>Obstetrics</option><option>Internal Medicine</option><option>Pediatrics</option><option>Surgery</option><option>Laboratory</option><option>Dental</option></select>
              </div>
              <div><label>Reason</label><textarea rows={3} placeholder="Describe your symptoms or reason..." /></div>
              <div><label>Visit Type</label>
                <select><option>In-Person</option><option>Telehealth (Video)</option><option>Telehealth (Audio)</option></select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowBooking(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={() => { setShowBooking(false); }} className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function SH({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <Icon size={14} style={{ color: 'var(--accent-primary)' }} />
      <span style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function AlertRow({ color, icon: Icon, text }: { color: string; icon: typeof AlertTriangle; text: string }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 'var(--card-radius)', background: `${color}08`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', gap: 7 }}>
      <Icon size={13} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: color === 'var(--accent-primary)' ? 'var(--accent-primary)' : color }}>{text}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, color, background: `${color}12`, textTransform: 'capitalize' }}>{text}</span>
  );
}

function Empty({ icon: Icon, text, action, onAction }: { icon: typeof User; text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="card-elevated" style={{ textAlign: 'center', padding: 40 }}>
      <Icon size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 10px' }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: action ? 10 : 0 }}>{text}</p>
      {action && onAction && <button onClick={onAction} className="btn btn-primary btn-sm" style={{ gap: 4 }}><Plus size={13} /> {action}</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PATIENT PORTAL STYLES — matches main landing page design
   ═══════════════════════════════════════════════════════════════ */
const patientPortalCSS = `
.pp-title {
  font-family: 'Space Grotesk', 'DM Sans', Helvetica, sans-serif;
  font-size: 32px; font-weight: 700; color: var(--text-primary);
  letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2;
}
.pp-subtitle {
  font-family: 'Inter', 'DM Sans', Helvetica, sans-serif;
  font-size: 16px; color: var(--text-secondary); line-height: 1.6;
  max-width: 380px; margin: 0 auto;
}
.pp-card {
  background: var(--bg-card-solid); border: 1px solid var(--border-medium);
  border-radius: 12px; box-shadow: var(--card-shadow-lg);
}
.pp-toggle {
  display: flex; margin-bottom: 28px; border-radius: 8px;
  overflow: hidden; border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
}
.pp-toggle__btn {
  flex: 1; padding: 14px 0; font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 14px; font-weight: 700; border: none; cursor: pointer;
  background: transparent; color: var(--text-secondary); transition: all 0.2s ease;
  border-radius: 7px; margin: 2px;
}
.pp-toggle__btn--active {
  background: var(--accent-primary); color: #fff;
  box-shadow: 0 2px 8px rgba(0,119,215,0.25);
}
.pp-field { margin-bottom: 20px; }
.pp-label {
  display: block; font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  margin-bottom: 8px; letter-spacing: 0;
  text-transform: none;
}
.pp-input {
  width: 100%; padding: 14px 16px; border-radius: 8px;
  border: 1px solid var(--border-medium); font-family: 'Inter', 'DM Sans', sans-serif;
  font-size: 16px; color: var(--text-primary); background: var(--bg-card-solid);
  transition: border-color 0.2s, box-shadow 0.2s; outline: none;
}
.pp-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 4px var(--accent-light); }
.pp-input::placeholder { color: var(--text-muted); }
.pp-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; padding: 16px 28px; border-radius: 8px;
  font-family: 'Inter', 'DM Sans', sans-serif; font-size: 16px;
  font-weight: 700; cursor: pointer; border: none;
  background: var(--accent-primary); color: #fff; transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,119,215,0.2);
}
.pp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,119,215,0.3); }
.pp-error {
  padding: 14px 16px; border-radius: 8px; background: rgba(218,18,48,0.06);
  border: 1px solid rgba(218,18,48,0.15); margin-bottom: 18px;
  display: flex; gap: 10px; align-items: flex-start;
  font-size: 14px; color: #DA1230; line-height: 1.5;
}
.pp-notice {
  margin-top: 24px; padding: 16px 18px; border-radius: 10px;
  background: var(--accent-light); border: 1px solid var(--accent-border);
  display: flex; gap: 10px; align-items: flex-start;
  font-size: 13px; color: var(--text-secondary); line-height: 1.6;
}
.pp-demo-btn {
  display: flex; flex-direction: column; gap: 3px; padding: 14px 16px;
  background: var(--bg-card-solid); border: 1px solid var(--border-medium);
  border-radius: 8px; cursor: pointer; text-align: left; width: 100%;
  transition: all 0.15s ease;
}
.pp-demo-btn:hover { border-color: var(--accent-primary); background: var(--accent-light); transform: translateY(-1px); }
`;
