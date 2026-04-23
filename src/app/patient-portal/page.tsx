'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  User, Calendar, FileText, FlaskConical, Syringe,
  HeartPulse, Shield, Pill, Scan, FolderOpen,
  ChevronRight, AlertTriangle,
  MessageSquare, ArrowRight, Activity,
  Plus, X, LogOut, Send, Building2,
  Wallet, CreditCard, Phone, Banknote,
  TrendingUp, Clock, CheckCircle2, Stethoscope,
  Thermometer, Weight, Droplets, Eye,
  Upload, ClipboardList, Receipt,
  UserCircle, Download, Trash2,
  Edit3, Save, Camera, FileUp,
} from '@/components/icons/lucide';
import type { PatientDoc, AppointmentDoc, LabResultDoc, MedicalRecordDoc, PrescriptionDoc, ImmunizationDoc } from '@/lib/db-types';

type Tab = 'overview' | 'appointments' | 'records' | 'lab' | 'prescriptions' | 'radiology' | 'documents' | 'immunizations' | 'messages' | 'chat' | 'billing' | 'insurance' | 'forms' | 'uploads' | 'statements' | 'profile';

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
        // Match by hospital number + full phone. We require an exact phone
        // match (after whitespace strip) because the old `endsWith(last 6)`
        // fallback meant that anyone with the right hospital ID and any
        // number ending in the patient's last 6 digits could log in.
        const hnum = hospitalNumber.trim().toUpperCase();
        const ph = phoneNumber.trim().replace(/\s/g, '');
        found = patients.find(p => {
          const pPhone = (p.phone || '').replace(/\s/g, '');
          return (p.hospitalNumber?.toUpperCase() === hnum || p.geocodeId?.toUpperCase() === hnum) &&
            pPhone === ph &&
            pPhone.length > 0;
        });
      } else {
        // Lookup by name + DOB — now require DOB (was optional), otherwise
        // two fields (first + last name) was too weak to gate real records.
        const fn = firstName.trim().toLowerCase();
        const sn = surname.trim().toLowerCase();
        if (!dateOfBirth) {
          setError('Date of birth is required for name-based lookup.');
          setLoading(false);
          return;
        }
        found = patients.find(p =>
          p.firstName.toLowerCase() === fn &&
          p.surname.toLowerCase() === sn &&
          p.dateOfBirth === dateOfBirth
        );
      }

      // Audit trail every portal lookup (success OR failure) so that a
      // clinician/admin can review who searched for whom — critical given
      // this form is on a public, unauthenticated route.
      try {
        const { logAudit } = await import('@/lib/services/audit-service');
        await logAudit(
          found ? 'PATIENT_PORTAL_LOGIN' : 'PATIENT_PORTAL_LOOKUP_FAIL',
          undefined,
          'patient-portal',
          mode === 'login'
            ? `hospital_number=${hospitalNumber.trim().slice(0, 20)} ${found ? `→ ${found._id}` : '(no match)'}`
            : `name=${firstName.trim().slice(0, 40)} ${surname.trim().slice(0, 40)} ${found ? `→ ${found._id}` : '(no match)'}`,
          !!found
        );
      } catch { /* audit best-effort */ }

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

  const BLUE = '#2E9E7E';
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
            <img src="/assets/taban-logo.svg" alt="Taban" className="w-16 h-16" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[0.12em]" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>Taban</h1>
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
  const [prescriptions, setPrescriptions] = useState<PrescriptionDoc[]>([]);
  const [immunizations, setImmunizations] = useState<ImmunizationDoc[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  // Load patient-specific data
  useEffect(() => {
    (async () => {
      try {
        const [aptMod, labMod, recMod, rxMod, immMod] = await Promise.all([
          import('@/lib/services/appointment-service'),
          import('@/lib/services/lab-service'),
          import('@/lib/services/medical-record-service'),
          import('@/lib/services/prescription-service'),
          import('@/lib/services/immunization-service'),
        ]);
        const [apts, labs, recs, rxs, imms] = await Promise.all([
          aptMod.getAppointmentsByPatient(patient._id),
          labMod.getLabResultsByPatient(patient._id),
          recMod.getRecordsByPatient(patient._id),
          rxMod.getPrescriptionsByPatient(patient._id),
          immMod.getByPatient(patient._id),
        ]);
        setAppointments(apts);
        setLabResults(labs);
        setRecords(recs);
        setPrescriptions(rxs);
        setImmunizations(imms);
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
    { key: 'immunizations', label: 'Immunizations', icon: Syringe },
    { key: 'insurance', label: 'Insurance', icon: Shield },
  ];
  const serviceTabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'billing', label: 'Billing & Payments', icon: Wallet },
    { key: 'statements', label: 'Statements', icon: Receipt },
    { key: 'forms', label: 'Forms', icon: ClipboardList },
    { key: 'uploads', label: 'Uploads', icon: Upload },
    { key: 'documents', label: 'Documents', icon: FolderOpen },
  ];
  const actionTabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'appointments', label: 'Appointments', icon: Calendar, count: upcomingApts.length },
    { key: 'chat', label: 'Messages', icon: MessageSquare },
    { key: 'profile', label: 'My Profile', icon: UserCircle },
  ];
  const tabs = [...mainTabs, ...serviceTabs, ...actionTabs];

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

          {/* Services section */}
          <div style={{ height: 1, background: 'var(--border-medium)', margin: '10px 14px' }} />
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 14px 4px', opacity: 0.7 }}>Services & Billing</p>
          {serviceTabs.map(tab => (
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

          {/* Communication & More section */}
          <div style={{ height: 1, background: 'var(--border-medium)', margin: '10px 14px' }} />
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 14px 4px', opacity: 0.7 }}>Communication & More</p>
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
      {activeTab === 'overview' && (() => {
        /* Extract latest vitals from most recent record */
        const sortedRecs = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const latestRec = sortedRecs[0] as unknown as Record<string, unknown> | undefined;
        const vitals = (latestRec?.vitalSigns || {}) as Record<string, string | number>;
        const latestDate = latestRec?.createdAt ? String(latestRec.createdAt).slice(0, 10) : null;

        /* Prescriptions from service */
        const activeRx = prescriptions.slice(0, 4);

        /* Recent activity timeline */
        type TimelineItem = { date: string; type: string; title: string; detail: string; icon: typeof User; color: string };
        const timeline: TimelineItem[] = [];
        records.slice(0, 3).forEach(rec => {
          const r = rec as unknown as Record<string, unknown>;
          timeline.push({ date: rec.createdAt?.slice(0, 10) || '', type: 'visit', title: (r.visitType as string) || 'Consultation', detail: ((r.diagnoses as Array<{name:string}>) || []).map(d => d.name).join(', ') || 'General checkup', icon: Stethoscope, color: 'var(--accent-primary)' });
        });
        labResults.slice(0, 3).forEach(lab => {
          timeline.push({ date: (lab.orderedAt || lab.createdAt).slice(0, 10), type: 'lab', title: lab.testName, detail: lab.status === 'completed' ? (lab.abnormal ? 'Abnormal result' : 'Normal result') : 'Pending', icon: FlaskConical, color: lab.abnormal ? 'var(--color-danger)' : 'var(--color-success)' });
        });
        timeline.sort((a, b) => b.date.localeCompare(a.date));

        const completedApts = appointments.filter(a => a.status === 'completed').length;
        const pendingLabs = labResults.filter(l => l.status === 'pending').length;
        const activeMeds = prescriptions.filter(r => r.status === 'pending').length;

        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Welcome Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1a6b5a 0%, #2E9E7E 60%, #43c6a4 100%)',
            borderRadius: 14, padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: 4 }}>Welcome back</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{patient.firstName} {patient.surname}</h2>
            <p style={{ fontSize: 13, opacity: 0.85 }}>{patient.hospitalNumber} &middot; {patient.registrationHospital}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
              {[
                { n: records.length, l: 'Total Visits' },
                { n: prescriptions.length, l: 'Prescriptions' },
                { n: labResults.length, l: 'Lab Tests' },
                { n: upcomingApts.length, l: 'Upcoming' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontSize: 22, fontWeight: 700 }}>{s.n}</p>
                  <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Stats Row — exactly 4 equal columns ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: Calendar, label: 'Next Appointment', value: upcomingApts.length > 0 ? upcomingApts[0].appointmentDate : 'None scheduled', color: 'var(--accent-primary)', bg: 'var(--accent-light)' },
              { icon: FlaskConical, label: 'Pending Labs', value: `${pendingLabs} pending`, color: pendingLabs > 0 ? 'var(--color-warning)' : 'var(--color-success)', bg: pendingLabs > 0 ? 'rgba(217,119,6,0.08)' : 'rgba(16,185,129,0.08)' },
              { icon: Pill, label: 'Active Meds', value: `${activeMeds} active`, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
              { icon: CheckCircle2, label: 'Completed Visits', value: `${completedApts} visit${completedApts !== 1 ? 's' : ''}`, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)' },
            ].map((stat, i) => (
              <div key={i} className="card-elevated" style={{ padding: '14px 14px', borderTop: `3px solid ${stat.color}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stat.value}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Row 1: Personal Info + Upcoming Appointments (equal height) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
            {/* Personal Information */}
            <div className="card-elevated" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              <SH icon={User} title="Personal Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, flex: 1 }}>
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

            {/* Upcoming Appointments */}
            <div className="card-elevated" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              <SH icon={Calendar} title="Upcoming Appointments" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 10 }}>
                {upcomingApts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {upcomingApts.slice(0, 3).map((apt, i) => (
                      <div key={apt._id} style={{ padding: 12, borderRadius: 10, background: i === 0 ? 'var(--accent-light)' : 'var(--overlay-subtle)', border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border-medium)'}`, flex: i === 0 ? 'none' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 2 }}>{apt.appointmentDate} at {apt.appointmentTime}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{apt.reason || apt.appointmentType}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Dr. {apt.providerName} &middot; {apt.department}</p>
                          </div>
                          {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-primary)', color: '#fff', textTransform: 'uppercase', flexShrink: 0 }}>Next</span>}
                        </div>
                      </div>
                    ))}
                    {upcomingApts.length > 3 && (
                      <button onClick={() => setActiveTab('appointments')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '6px 0', marginTop: 'auto' }}>
                        +{upcomingApts.length - 3} more →
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
                    <Calendar size={24} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>No upcoming appointments</p>
                    <button onClick={() => setShowBooking(true)} style={{ fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={12} />Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 2: Latest Vitals (full width) ── */}
          <div className="card-elevated" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SH icon={Activity} title="Latest Vitals" />
              {latestDate && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Recorded {latestDate}</span>}
            </div>
            {Object.keys(vitals).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 12 }}>
                {[
                  { key: 'bloodPressure', label: 'Blood Pressure', icon: HeartPulse, unit: 'mmHg', color: '#EF4444' },
                  { key: 'heartRate', label: 'Heart Rate', icon: Activity, unit: 'bpm', color: '#EC4899' },
                  { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', color: '#F59E0B' },
                  { key: 'weight', label: 'Weight', icon: Weight, unit: 'kg', color: '#6366F1' },
                  { key: 'respiratoryRate', label: 'Resp. Rate', icon: Droplets, unit: '/min', color: '#06B6D4' },
                  { key: 'oxygenSaturation', label: 'SpO₂', icon: Eye, unit: '%', color: '#10B981' },
                ].filter(v => vitals[v.key]).map(v => (
                  <div key={v.key} style={{ padding: '12px 14px', borderRadius: 10, background: `${v.color}08`, border: `1px solid ${v.color}15`, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
                      <v.icon size={12} style={{ color: v.color }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v.label}</span>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{String(vitals[v.key])}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{v.unit}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>No vitals recorded yet. Visit your facility for a check-up.</p>
            )}
          </div>

          {/* ── Row 3: Health Alerts + Current Medications (equal height) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
            {/* Health Alerts */}
            <div className="card-elevated" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              <SH icon={AlertTriangle} title="Health Alerts" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, flex: 1 }}>
                {(patient.allergies || []).length > 0 && (
                  <AlertRow color="#EF4444" icon={AlertTriangle} text={`Allergies: ${patient.allergies.join(', ')}`} />
                )}
                {(patient.chronicConditions || []).map((c, i) => (
                  <AlertRow key={i} color="#D97706" icon={HeartPulse} text={c} />
                ))}
                {pendingLabs > 0 && (
                  <AlertRow color="var(--accent-primary)" icon={FlaskConical} text={`${pendingLabs} pending lab result(s)`} />
                )}
                {labResults.some(l => l.critical) && (
                  <AlertRow color="#EF4444" icon={AlertTriangle} text="Critical lab result — contact your provider" />
                )}
                {(patient.allergies || []).length === 0 && (patient.chronicConditions || []).length === 0 && pendingLabs === 0 && (
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>No active health alerts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Medications */}
            <div className="card-elevated" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SH icon={Pill} title="Current Medications" />
                {activeRx.length > 0 && <button onClick={() => setActiveTab('prescriptions')} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>}
              </div>
              <div style={{ flex: 1, marginTop: 10 }}>
                {activeRx.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeRx.map((rx, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--overlay-subtle)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Pill size={12} style={{ color: '#7C3AED' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rx.medication}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rx.dose} · {rx.frequency}</p>
                        </div>
                        <Badge text={rx.status} color={rx.status === 'dispensed' ? 'var(--color-success)' : 'var(--color-warning)'} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No medications prescribed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 4: Recent Activity + Quick Actions (equal height) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
            {/* Recent Activity */}
            <div className="card-elevated" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              <SH icon={Clock} title="Recent Activity" />
              <div style={{ flex: 1, marginTop: 12 }}>
                {timeline.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--border-medium)' }} />
                    {timeline.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ position: 'relative', marginBottom: i < Math.min(timeline.length, 5) - 1 ? 14 : 0 }}>
                        <div style={{ position: 'absolute', left: -16, top: 2, width: 16, height: 16, borderRadius: '50%', background: `${item.color}15`, border: `2px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 1 }}>{item.date}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No recent activity.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-elevated" style={{ padding: 18, background: 'linear-gradient(135deg, #1a3a4a 0%, #1a4a3a 100%)', border: 'none', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {[
                  { label: 'Book Appointment', icon: Calendar, action: () => setShowBooking(true) },
                  { label: 'View Lab Results', icon: FlaskConical, action: () => setActiveTab('lab') },
                  { label: 'My Prescriptions', icon: Pill, action: () => setActiveTab('prescriptions') },
                  { label: 'Message Doctor', icon: MessageSquare, action: () => setActiveTab('chat') },
                  { label: 'Pay Bills', icon: Wallet, action: () => setActiveTab('billing') },
                  { label: 'My Profile', icon: UserCircle, action: () => setActiveTab('profile') },
                ].map((qa, i) => (
                  <button key={i} onClick={qa.action} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                    borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                    color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <qa.icon size={14} style={{ opacity: 0.7 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{qa.label}</span>
                    <ChevronRight size={12} style={{ opacity: 0.4 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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
                  <div key={apt._id} className="card-elevated" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Prescriptions ({prescriptions.length})</h2>
          {prescriptions.length === 0 ? (
            <Empty icon={Pill} text="No prescriptions found" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prescriptions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(rx => (
                <div key={rx._id} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: rx.status === 'dispensed' ? 'rgba(16,185,129,0.08)' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Pill size={16} style={{ color: rx.status === 'dispensed' ? 'var(--color-success)' : 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{rx.medication}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rx.dose} · {rx.route} · {rx.frequency} · {rx.duration}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Prescribed by {rx.prescribedBy}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Badge text={rx.status} color={rx.status === 'dispensed' ? 'var(--color-success)' : 'var(--color-warning)'} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{rx.createdAt.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* ═══ Billing & Payments ═══ */}
      {activeTab === 'billing' && <BillingTab patient={patient} />}

      {/* ═══ Immunizations ═══ */}
      {activeTab === 'immunizations' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Immunization Record ({immunizations.length})</h2>
          {immunizations.length === 0 ? (
            <div>
              <Empty icon={Syringe} text="No immunization records found" />
              <div className="card-elevated" style={{ padding: 18, marginTop: 14 }}>
                <SH icon={Syringe} title="About Immunizations" />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                  Immunization data is loaded from the facility system. Visit your nearest health center to view or update your vaccination record.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {immunizations.sort((a, b) => b.dateGiven.localeCompare(a.dateGiven)).map(imm => (
                <div key={imm._id} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Syringe size={16} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{imm.vaccine} — Dose {imm.doseNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Site: {imm.site} · Batch: {imm.batchNumber}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>By {imm.administeredBy} · {imm.facilityName}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{imm.dateGiven}</div>
                    {imm.nextDueDate && <div style={{ fontSize: 10, color: 'var(--color-warning)', marginTop: 2 }}>Next: {imm.nextDueDate}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Insurance ═══ */}
      {activeTab === 'insurance' && (
        <InsuranceTab patient={patient} />
      )}

      {/* ═══ Forms ═══ */}
      {activeTab === 'forms' && (
        <FormsTab />
      )}

      {/* ═══ Uploads ═══ */}
      {activeTab === 'uploads' && (
        <UploadsTab />
      )}

      {/* ═══ Statements ═══ */}
      {activeTab === 'statements' && (
        <StatementsTab />
      )}

      {/* ═══ My Profile ═══ */}
      {activeTab === 'profile' && (
        <ProfileTab patient={patient} />
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

/* ═════════════════════════════════════════
   INSURANCE TAB
   ═════════════════════════════════════════ */
function InsuranceTab({ patient }: { patient: PatientDoc }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [insuranceList] = useState([
    ...(patient.insuranceProvider ? [{
      id: 'ins-1',
      provider: patient.insuranceProvider,
      policyNumber: patient.insuranceNumber || 'N/A',
      type: 'Primary',
      status: 'Active' as const,
      expiryDate: '2027-01-01',
    }] : []),
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Insurance Information</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={13} /> Add Insurance
        </button>
      </div>

      {/* Info banner */}
      <div className="card-elevated" style={{ padding: 16, marginBottom: 16, background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Your insurance information is used to process referrals, arrange pharmacy services, and bill laboratory tests.
          Keep your insurance details up to date to ensure smooth claims processing.
        </p>
      </div>

      {/* Insurances on file */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Insurances on File</h3>
      {insuranceList.length === 0 ? (
        <Empty icon={Shield} text="No insurance on file. Add your insurance details to enable claims processing." action="Add Insurance" onAction={() => setShowAddForm(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insuranceList.map(ins => (
            <div key={ins.id} className="card-elevated" style={{ padding: '16px 18px', borderLeft: '4px solid var(--color-success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{ins.provider}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ins.type} Insurance</p>
                </div>
                <Badge text={ins.status} color="var(--color-success)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <Info label="Policy Number" value={ins.policyNumber} />
                <Info label="Expires" value={ins.expiryDate} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload insurance card */}
      <div className="card-elevated" style={{ padding: 18, marginTop: 16 }}>
        <SH icon={Upload} title="Upload Insurance Card" />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 12 }}>
          Upload the front and back of your insurance card for verification. Accepted formats: .jpg, .png, .pdf (max 4 MB).
        </p>
        <div style={{
          padding: 24, borderRadius: 10, border: '2px dashed var(--border-medium)', textAlign: 'center',
          background: 'var(--overlay-subtle)', cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <FileUp size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Click to upload or drag and drop</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, or PDF up to 4 MB</p>
        </div>
      </div>

      {/* Add Insurance Form Modal */}
      {showAddForm && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="modal-panel modal-panel--md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Insurance</h3>
              <button onClick={() => setShowAddForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--overlay-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label>Insurance Provider</label><input type="text" placeholder="e.g. National Health Insurance Fund" /></div>
              <div><label>Policy / Member Number</label><input type="text" placeholder="e.g. NHIF-12345678" /></div>
              <div><label>Insurance Type</label>
                <select><option>Primary</option><option>Secondary</option><option>Supplemental</option></select>
              </div>
              <div><label>Policy Holder</label><input type="text" placeholder="Name of the policy holder" /></div>
              <div><label>Expiry Date</label><input type="date" /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={() => setShowAddForm(false)} className="btn btn-primary" style={{ flex: 1 }}>Save Insurance</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   FORMS TAB
   ═════════════════════════════════════════ */
function FormsTab() {
  const forms = [
    { id: 'f1', name: 'Patient Registration Form', status: 'completed' as const, date: '2026-02-01', required: true },
    { id: 'f2', name: 'Medical History Questionnaire', status: 'completed' as const, date: '2026-02-01', required: true },
    { id: 'f3', name: 'Consent for Treatment', status: 'completed' as const, date: '2026-02-01', required: true },
    { id: 'f4', name: 'Insurance Authorization Form', status: 'pending' as const, date: '', required: false },
    { id: 'f5', name: 'Advance Directive / Living Will', status: 'pending' as const, date: '', required: false },
    { id: 'f6', name: 'Patient Satisfaction Survey', status: 'available' as const, date: '', required: false },
    { id: 'f7', name: 'Prescription Refill Request', status: 'available' as const, date: '', required: false },
    { id: 'f8', name: 'Referral Request Form', status: 'available' as const, date: '', required: false },
  ];

  const statusIcon = (s: string) => {
    if (s === 'completed') return { color: 'var(--color-success)', text: 'Completed' };
    if (s === 'pending') return { color: 'var(--color-warning)', text: 'Pending' };
    return { color: 'var(--accent-primary)', text: 'Available' };
  };

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Patient Forms</h2>

      {/* Required forms */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Required Forms</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {forms.filter(f => f.required).map(form => {
          const si = statusIcon(form.status);
          return (
            <div key={form.id} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${si.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={16} style={{ color: si.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name}</p>
                {form.date && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed: {form.date}</p>}
              </div>
              <Badge text={si.text} color={si.color} />
            </div>
          );
        })}
      </div>

      {/* Optional / available forms */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Optional & Available Forms</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {forms.filter(f => !f.required).map(form => {
          const si = statusIcon(form.status);
          return (
            <div key={form.id} className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: form.status !== 'completed' ? 'pointer' : 'default' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${si.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={16} style={{ color: si.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name}</p>
                {form.date && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed: {form.date}</p>}
              </div>
              {form.status !== 'completed' ? (
                <button style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {form.status === 'pending' ? 'Complete' : 'Fill Out'}
                </button>
              ) : (
                <Badge text="Done" color="var(--color-success)" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   UPLOADS TAB
   ═════════════════════════════════════════ */
function UploadsTab() {
  const [uploads] = useState([
    { id: 'u1', name: 'Insurance Card (Front)', type: 'image/png', size: '1.2 MB', date: '2026-02-01', category: 'Insurance' },
    { id: 'u2', name: 'Insurance Card (Back)', type: 'image/png', size: '1.1 MB', date: '2026-02-01', category: 'Insurance' },
    { id: 'u3', name: 'National ID', type: 'image/jpg', size: '0.8 MB', date: '2026-02-01', category: 'Identification' },
    { id: 'u4', name: 'Referral Letter — JTH', type: 'application/pdf', size: '0.3 MB', date: '2026-03-15', category: 'Medical' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>My Uploads ({uploads.length})</h2>
      </div>

      {/* Upload area */}
      <div className="card-elevated" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{
          padding: 32, borderRadius: 10, border: '2px dashed var(--border-medium)', textAlign: 'center',
          background: 'var(--overlay-subtle)', cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <Upload size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 10px', opacity: 0.6 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Upload Documents</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drag files here or click to browse</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Accepted: PDF, PNG, JPG, TIFF (max 4 MB per file)</p>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {['Insurance Card', 'ID Document', 'Referral Letter', 'Lab Report', 'Other'].map(cat => (
            <button key={cat} style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6, background: 'var(--overlay-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* File list */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Uploaded Files</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {uploads.map(file => (
          <div key={file.id} className="card-elevated" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {file.type.includes('pdf') ? <FileText size={16} style={{ color: 'var(--accent-primary)' }} /> : <Camera size={16} style={{ color: 'var(--accent-primary)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{file.category} · {file.size} · {file.date}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Download size={13} /></button>
              <button style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Guidelines */}
      <div className="card-elevated" style={{ padding: 14, marginTop: 16, background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Upload Tips:</strong> File names must be under 20 characters with no special characters.
          Scan documents in black and white at 150 DPI for best quality. Be sure to upload both front and back of insurance cards.
        </p>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   STATEMENTS TAB
   ═════════════════════════════════════════ */
function StatementsTab() {
  const statements = [
    { id: 'st-001', period: 'March 2026', date: '2026-04-01', total: 80000, paid: 23500, items: 3 },
    { id: 'st-002', period: 'February 2026', date: '2026-03-01', total: 25000, paid: 25000, items: 2 },
    { id: 'st-003', period: 'January 2026', date: '2026-02-01', total: 15000, paid: 15000, items: 1 },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Billing Statements</h2>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Current Balance', value: `${(statements[0].total - statements[0].paid).toLocaleString()} SSP`, color: 'var(--color-danger)' },
          { label: 'Last Payment', value: '10,000 SSP', color: 'var(--color-success)' },
          { label: 'Total Statements', value: `${statements.length}`, color: 'var(--accent-primary)' },
        ].map((s, i) => (
          <div key={i} className="card-elevated" style={{ padding: '14px 16px', borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Statement list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {statements.map(st => {
          const balance = st.total - st.paid;
          return (
            <div key={st.id} className="card-elevated" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Statement — {st.period}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Generated {st.date} · {st.items} item{st.items !== 1 ? 's' : ''}</p>
                </div>
                <Badge text={balance === 0 ? 'Paid' : 'Outstanding'} color={balance === 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <Info label="Total Billed" value={`${st.total.toLocaleString()} SSP`} />
                <Info label="Paid" value={`${st.paid.toLocaleString()} SSP`} />
                <Info label="Balance" value={`${balance.toLocaleString()} SSP`} />
              </div>
              {balance > 0 && (
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border-medium)', overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${(st.paid / st.total) * 100}%`, background: 'var(--color-success)', borderRadius: 2 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, background: 'var(--overlay-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={12} /> Download PDF
                </button>
                {balance > 0 && (
                  <button style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   PROFILE TAB
   ═════════════════════════════════════════ */
function ProfileTab({ patient }: { patient: PatientDoc }) {
  const [editing, setEditing] = useState(false);

  const fields = [
    { label: 'First Name', value: patient.firstName, editable: false },
    { label: 'Middle Name', value: patient.middleName || '—', editable: false },
    { label: 'Surname', value: patient.surname, editable: false },
    { label: 'Date of Birth', value: patient.dateOfBirth || `~${patient.estimatedAge} years`, editable: false },
    { label: 'Gender', value: patient.gender, editable: false },
    { label: 'Blood Type', value: patient.bloodType || '—', editable: false },
    { label: 'Phone', value: patient.phone || '—', editable: true },
    { label: 'Geocode ID', value: patient.geocodeId || '—', editable: false },
    { label: 'County', value: patient.county || '—', editable: true },
    { label: 'State', value: patient.state || '—', editable: true },
    { label: 'Hospital Number', value: patient.hospitalNumber || '—', editable: false },
    { label: 'Registration Hospital', value: patient.registrationHospital || '—', editable: false },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</h2>
        <button onClick={() => setEditing(!editing)} style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: editing ? 'var(--color-success)' : 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          {editing ? <><Save size={13} /> Save Changes</> : <><Edit3 size={13} /> Edit Profile</>}
        </button>
      </div>

      {/* Profile header */}
      <div className="card-elevated" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-light)', border: '3px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          {patient.photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={patient.photoUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            : <User size={32} style={{ color: 'var(--accent-primary)' }} />
          }
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{patient.firstName} {patient.surname}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{patient.hospitalNumber} · {patient.registrationHospital}</p>
      </div>

      {/* Fields grid */}
      <div className="card-elevated" style={{ padding: 18 }}>
        <SH icon={User} title="Personal Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          {fields.map((f, i) => (
            <div key={i}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</p>
              {editing && f.editable ? (
                <input type="text" defaultValue={f.value} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--accent-primary)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
              ) : (
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="card-elevated" style={{ padding: 18, marginTop: 14 }}>
        <SH icon={Phone} title="Emergency Contact" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <Info label="Name" value={patient.emergencyContact?.name || '—'} />
          <Info label="Phone" value={patient.emergencyContact?.phone || '—'} />
          <Info label="Relationship" value={patient.emergencyContact?.relationship || '—'} />
        </div>
      </div>

      {/* Allergies & chronic conditions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card-elevated" style={{ padding: 18 }}>
          <SH icon={AlertTriangle} title="Allergies" />
          <div style={{ marginTop: 10 }}>
            {(patient.allergies || []).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patient.allergies.map((a, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>{a}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No known allergies</p>
            )}
          </div>
        </div>
        <div className="card-elevated" style={{ padding: 18 }}>
          <SH icon={HeartPulse} title="Chronic Conditions" />
          <div style={{ marginTop: 10 }}>
            {(patient.chronicConditions || []).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patient.chronicConditions.map((c, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(217,119,6,0.08)', color: '#D97706', border: '1px solid rgba(217,119,6,0.15)' }}>{c}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No chronic conditions recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Note about editable fields */}
      {!editing && (
        <div className="card-elevated" style={{ padding: 14, marginTop: 14, background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Some personal information like name, date of birth, and hospital number can only be updated by hospital staff.
            Contact your facility to request changes to protected fields.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   BILLING & PAYMENTS TAB
   ═════════════════════════════════════════ */
type BillItem = {
  id: string;
  date: string;
  description: string;
  department: string;
  amount: number;
  paid: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
};

type PaymentMethod = 'mpesa' | 'mtn' | 'airtel' | 'card' | 'bank';

function BillingTab({ patient }: { patient: PatientDoc }) {
  const [step, setStep] = useState<'bills' | 'method' | 'confirm' | 'success'>('bills');
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(null);
  const [payPhone, setPayPhone] = useState(patient.phone || '');

  /* Mock billing data */
  const bills: BillItem[] = [
    { id: 'B-2026-001', date: '2026-04-10', description: 'General Consultation', department: 'OPD', amount: 15000, paid: 15000, status: 'paid' },
    { id: 'B-2026-002', date: '2026-04-08', description: 'Complete Blood Count + Malaria RDT', department: 'Laboratory', amount: 25000, paid: 10000, status: 'partial' },
    { id: 'B-2026-003', date: '2026-03-28', description: 'Prenatal Check-up & Ultrasound', department: 'Obstetrics', amount: 35000, paid: 0, status: 'unpaid' },
    { id: 'B-2026-004', date: '2026-03-15', description: 'Pharmacy — Amoxicillin, Paracetamol', department: 'Pharmacy', amount: 8500, paid: 8500, status: 'paid' },
    { id: 'B-2026-005', date: '2026-02-20', description: 'Emergency Visit — Wound Treatment', department: 'Emergency', amount: 45000, paid: 0, status: 'overdue' },
  ];

  const totalOwed = bills.reduce((s, b) => s + (b.amount - b.paid), 0);
  const totalPaid = bills.reduce((s, b) => s + b.paid, 0);
  const selectedTotal = bills.filter(b => selectedBills.includes(b.id)).reduce((s, b) => s + (b.amount - b.paid), 0);

  const statusColor = (s: BillItem['status']) => {
    switch (s) {
      case 'paid': return 'var(--color-success)';
      case 'partial': return 'var(--color-warning)';
      case 'unpaid': return 'var(--accent-primary)';
      case 'overdue': return 'var(--color-danger)';
    }
  };

  const paymentMethods: { key: PaymentMethod; name: string; icon: typeof Phone; desc: string; color: string }[] = [
    { key: 'mpesa', name: 'M-Pesa', icon: Phone, desc: 'Pay via Safaricom M-Pesa', color: '#4CAF50' },
    { key: 'mtn', name: 'MTN Mobile Money', icon: Phone, desc: 'Pay via MTN MoMo', color: '#FFC107' },
    { key: 'airtel', name: 'Airtel Money', icon: Phone, desc: 'Pay via Airtel Money', color: '#E53935' },
    { key: 'card', name: 'Card Payment', icon: CreditCard, desc: 'Visa / Mastercard via Flutterwave', color: '#5C6BC0' },
    { key: 'bank', name: 'Bank Transfer', icon: Banknote, desc: 'Direct bank transfer (manual)', color: '#00897B' },
  ];

  const refNum = `TBN-${Date.now().toString(36).toUpperCase()}`;

  if (step === 'success') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div className="card-elevated" style={{ padding: '40px 28px', borderTop: '4px solid var(--color-success)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={28} style={{ color: 'var(--color-success)' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Payment Submitted</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {payMethod === 'mpesa' || payMethod === 'mtn' || payMethod === 'airtel'
              ? 'Check your phone for the payment prompt. Confirm on your device.'
              : payMethod === 'card'
              ? 'You will be redirected to Flutterwave to complete your payment.'
              : 'Transfer the amount to the bank account shown below.'}
          </p>
          <div style={{ padding: 16, borderRadius: 10, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', textAlign: 'left', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference</p><p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{refNum}</p></div>
              <div><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</p><p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTotal.toLocaleString()} SSP</p></div>
              <div><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Method</p><p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{paymentMethods.find(m => m.key === payMethod)?.name}</p></div>
              <div><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bills</p><p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedBills.length} item{selectedBills.length !== 1 ? 's' : ''}</p></div>
            </div>
            {payMethod === 'bank' && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(0,137,123,0.06)', border: '1px solid rgba(0,137,123,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#00897B', marginBottom: 6 }}>Bank Transfer Details</p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>Bank: <strong>KCB Bank South Sudan</strong></p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>Account: <strong>720-184-2930</strong></p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>Name: <strong>Taban Health Services</strong></p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>Ref: <strong>{refNum}</strong></p>
              </div>
            )}
          </div>
          <button onClick={() => { setStep('bills'); setSelectedBills([]); setPayMethod(null); }} style={{ fontSize: 13, fontWeight: 600, padding: '10px 24px', borderRadius: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const method = paymentMethods.find(m => m.key === payMethod)!;
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => setStep('method')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
        <div className="card-elevated" style={{ padding: 20, borderTop: `4px solid ${method.color}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Confirm Payment</h3>
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--overlay-subtle)', border: '1px solid var(--border-medium)', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Info label="Total Amount" value={`${selectedTotal.toLocaleString()} SSP`} />
              <Info label="Payment Method" value={method.name} />
              <Info label="Items" value={`${selectedBills.length} bill${selectedBills.length !== 1 ? 's' : ''}`} />
              {(payMethod === 'mpesa' || payMethod === 'mtn' || payMethod === 'airtel') && <Info label="Phone" value={payPhone} />}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Bills Included</p>
            {bills.filter(b => selectedBills.includes(b.id)).map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-medium)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{b.description}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{(b.amount - b.paid).toLocaleString()} SSP</span>
              </div>
            ))}
          </div>
          {(payMethod === 'mpesa' || payMethod === 'mtn' || payMethod === 'airtel') && (
            <div style={{ padding: 10, borderRadius: 8, background: `${method.color}10`, border: `1px solid ${method.color}20`, marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: method.color, fontWeight: 600 }}>A payment prompt will be sent to {payPhone}. Confirm on your phone.</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('method')} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border-medium)', background: 'var(--bg-card-solid)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => setStep('success')} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: method.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Pay {selectedTotal.toLocaleString()} SSP</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'method') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => setStep('bills')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← Back to Bills</button>
        <div className="card-elevated" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Choose Payment Method</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{selectedTotal.toLocaleString()} SSP</strong> for {selectedBills.length} bill{selectedBills.length !== 1 ? 's' : ''}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {paymentMethods.map(m => (
              <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px',
                borderRadius: 10, border: payMethod === m.key ? `2px solid ${m.color}` : '1px solid var(--border-medium)',
                background: payMethod === m.key ? `${m.color}08` : 'var(--bg-card-solid)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icon size={18} style={{ color: m.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</p>
                </div>
                {payMethod === m.key && <CheckCircle2 size={18} style={{ color: m.color }} />}
              </button>
            ))}
          </div>
          {payMethod && (payMethod === 'mpesa' || payMethod === 'mtn' || payMethod === 'airtel') && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Phone Number</label>
              <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="+211 9XX XXX XXX"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-medium)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
            </div>
          )}
          <button onClick={() => payMethod && setStep('confirm')} disabled={!payMethod}
            style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: payMethod ? 'var(--accent-primary)' : 'var(--border-medium)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: payMethod ? 'pointer' : 'not-allowed', opacity: payMethod ? 1 : 0.5 }}>
            Continue to Confirm
          </button>
        </div>
      </div>
    );
  }

  /* Bills list (default step) */
  return (
    <div>
      {/* Balance banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a6b5a 0%, #2E9E7E 60%, #43c6a4 100%)',
        borderRadius: 14, padding: '20px 24px', color: '#fff', marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 4 }}>Account Summary</p>
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 8 }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{totalOwed.toLocaleString()} <span style={{ fontSize: 14, opacity: 0.7 }}>SSP</span></p>
            <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>Outstanding Balance</p>
          </div>
          <div>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{totalPaid.toLocaleString()} <span style={{ fontSize: 14, opacity: 0.7 }}>SSP</span></p>
            <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>Total Paid</p>
          </div>
          <div>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{bills.length}</p>
            <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>Total Bills</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {/* Bills list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Your Bills</h3>
            {selectedBills.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)' }}>{selectedBills.length} selected</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bills.map(bill => {
              const remaining = bill.amount - bill.paid;
              const isSelectable = remaining > 0;
              const isSelected = selectedBills.includes(bill.id);
              return (
                <div key={bill.id} className="card-elevated" style={{
                  padding: '14px 16px', borderTop: `3px solid ${statusColor(bill.status)}`,
                  opacity: bill.status === 'paid' ? 0.7 : 1,
                  cursor: isSelectable ? 'pointer' : 'default',
                  outline: isSelected ? `2px solid var(--accent-primary)` : 'none',
                  outlineOffset: -2,
                }} onClick={() => {
                  if (!isSelectable) return;
                  setSelectedBills(prev => prev.includes(bill.id) ? prev.filter(id => id !== bill.id) : [...prev, bill.id]);
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                    {isSelectable && (
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, marginTop: 2, flexShrink: 0,
                        border: isSelected ? 'none' : '2px solid var(--border-medium)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <CheckCircle2 size={14} style={{ color: '#fff' }} />}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{bill.description}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bill.department} &middot; {bill.date}</p>
                        </div>
                        <Badge text={bill.status} color={statusColor(bill.status)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: {bill.amount.toLocaleString()} SSP</span>
                        {remaining > 0 ? (
                          <span style={{ fontSize: 14, fontWeight: 700, color: statusColor(bill.status) }}>{remaining.toLocaleString()} SSP due</span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)' }}>Fully paid</span>
                        )}
                      </div>
                      {bill.status === 'partial' && (
                        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--border-medium)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(bill.paid / bill.amount) * 100}%`, background: 'var(--color-warning)', borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pay selected */}
          <div className="card-elevated" style={{ padding: 18, borderTop: '3px solid var(--accent-primary)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              {selectedBills.length > 0 ? 'Pay Selected Bills' : 'Select Bills to Pay'}
            </h4>
            {selectedBills.length > 0 ? (
              <>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--accent-light)', border: '1px solid var(--accent-border)', marginBottom: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Amount to Pay</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>{selectedTotal.toLocaleString()} <span style={{ fontSize: 12 }}>SSP</span></p>
                </div>
                <button onClick={() => setStep('method')} style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Proceed to Pay
                </button>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tap on unpaid bills to select them for payment.</p>
            )}
            {bills.filter(b => b.amount - b.paid > 0).length > 0 && selectedBills.length === 0 && (
              <button onClick={() => setSelectedBills(bills.filter(b => b.amount - b.paid > 0).map(b => b.id))} style={{ width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 8, border: '1px solid var(--accent-primary)', background: 'transparent', color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Select All Outstanding
              </button>
            )}
          </div>

          {/* Payment methods info */}
          <div className="card-elevated" style={{ padding: 18 }}>
            <SH icon={CreditCard} title="Accepted Payment Methods" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {paymentMethods.map(m => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--overlay-subtle)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${m.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <m.icon size={13} style={{ color: m.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment history summary */}
          <div className="card-elevated" style={{ padding: 18, background: 'linear-gradient(135deg, #1a3a4a 0%, #1a4a3a 100%)', border: 'none' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Payment Summary</p>
            {[
              { label: 'Total Billed', value: `${bills.reduce((s, b) => s + b.amount, 0).toLocaleString()} SSP` },
              { label: 'Total Paid', value: `${totalPaid.toLocaleString()} SSP` },
              { label: 'Outstanding', value: `${totalOwed.toLocaleString()} SSP` },
              { label: 'Overdue', value: `${bills.filter(b => b.status === 'overdue').reduce((s, b) => s + (b.amount - b.paid), 0).toLocaleString()} SSP` },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Help */}
          <div className="card-elevated" style={{ padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>Need help?</strong> Contact your facility&apos;s billing department or use the Messages tab to reach a staff member.
            </p>
          </div>
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
