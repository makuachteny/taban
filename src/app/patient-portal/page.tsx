'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  User, Calendar, FileText, FlaskConical, Syringe,
  HeartPulse, Shield,
  ChevronRight, AlertTriangle,
  MessageSquare, ArrowRight, Activity,
  Plus, X, LogOut,
} from 'lucide-react';
import type { PatientDoc, AppointmentDoc, LabResultDoc, MedicalRecordDoc } from '@/lib/db-types';

type Tab = 'overview' | 'appointments' | 'records' | 'lab' | 'prescriptions' | 'immunizations' | 'messages';

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)' }}>
      <style dangerouslySetInnerHTML={{ __html: patientPortalCSS }} />
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/taban-icon.svg" alt="Taban" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px' }} />
          <h1 className="pp-title">Patient Portal</h1>
          <p className="pp-subtitle">Access your health records, appointments, and lab results</p>
        </div>

        {/* Login card */}
        <div className="pp-card" style={{ padding: 32, textAlign: 'left' }}>
          {/* Mode toggle */}
          <div className="pp-toggle">
            <button onClick={() => { setMode('login'); setError(''); }} className={`pp-toggle__btn ${mode === 'login' ? 'pp-toggle__btn--active' : ''}`}>Hospital ID</button>
            <button onClick={() => { setMode('lookup'); setError(''); }} className={`pp-toggle__btn ${mode === 'lookup' ? 'pp-toggle__btn--active' : ''}`}>Name Lookup</button>
          </div>

          {!dbReady && (
            <div style={{ padding: '10px 14px', borderRadius: 4, background: 'var(--accent-light)', border: '1px solid var(--accent-border)', marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>Initializing database...</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {mode === 'login' ? (
              <>
                <div className="pp-field">
                  <label className="pp-label">Hospital Number or Geocode ID</label>
                  <input className="pp-input" type="text" value={hospitalNumber} onChange={e => setHospitalNumber(e.target.value)}
                    placeholder="e.g. JTH-000001 or BOMA-JB-HH1024" required />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Phone Number</label>
                  <input className="pp-input" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +211 912 345 678" required />
                </div>
              </>
            ) : (
              <>
                <div className="pp-field">
                  <label className="pp-label">First Name</label>
                  <input className="pp-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Your first name" required />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Surname</label>
                  <input className="pp-input" type="text" value={surname} onChange={e => setSurname(e.target.value)}
                    placeholder="Your surname" required />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Date of Birth (optional)</label>
                  <input className="pp-input" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
              </>
            )}

            {error && (
              <div className="pp-error">
                <AlertTriangle size={14} style={{ color: '#DA1230', flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="pp-btn-primary" style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Searching...' : 'Access My Records'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="pp-notice">
            <Shield size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
            <span>Your data is encrypted and stored locally on this device. We never share your information without consent.</span>
          </div>

          {/* Demo accounts */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Demo Accounts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { id: 'JTH-000001', phone: '0912345678', name: 'Deng Mabior Garang' },
                { id: 'JTH-000002', phone: '0916111222', name: 'Nyabol Gatdet Koang' },
                { id: 'JTH-000003', phone: '0921333444', name: 'Achol Mayen Deng' },
              ].map(demo => (
                <button key={demo.id} type="button" onClick={() => { setMode('login'); setHospitalNumber(demo.id); setPhoneNumber(demo.phone); setError(''); }}
                  className="pp-demo-btn">
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{demo.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{demo.id} &middot; {demo.phone}</span>
                </button>
              ))}
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

  const tabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'appointments', label: 'Appointments', icon: Calendar, count: upcomingApts.length },
    { key: 'records', label: 'Records', icon: FileText, count: records.length },
    { key: 'lab', label: 'Lab Results', icon: FlaskConical, count: labResults.filter(l => l.status === 'pending').length },
    { key: 'immunizations', label: 'Immunizations', icon: Syringe },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="page-enter">
      <style dangerouslySetInnerHTML={{ __html: patientPortalCSS }} />
      {/* Header bar */}
      <div className="card-elevated" style={{ padding: '16px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {patient.photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={patient.photoUrl} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
            : <User size={20} style={{ color: 'var(--accent-primary)' }} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Welcome, {patient.firstName}</h1>
          <p style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>{patient.hospitalNumber} &middot; {patient.registrationHospital}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowBooking(true)} className="pp-btn-primary" style={{ padding: '8px 16px', fontSize: 13, gap: 4, borderRadius: 4 }}><Plus size={13} /> Book Appointment</button>
          <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: 'var(--bg-card-solid)', border: '1px solid var(--border-medium)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-secondary)' }}><LogOut size={13} /> Sign Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            borderRadius: 4, border: activeTab === tab.key ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)', cursor: 'pointer',
            background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--bg-card-solid)',
            color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
            boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,119,215,0.25)' : 'var(--card-shadow)',
            transition: 'all 0.2s ease',
          }}>
            <tab.icon size={13} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count ? <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--accent-light)',
              color: activeTab === tab.key ? '#fff' : 'var(--accent-primary)',
            }}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

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
                    <Badge text={apt.status.replace('_', ' ')} color={isPast ? 'var(--text-muted)' : apt.status === 'confirmed' ? '#10B981' : 'var(--accent-primary)'} />
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
                    <FlaskConical size={14} style={{ color: lab.status === 'pending' ? '#D97706' : lab.abnormal ? '#EF4444' : '#10B981', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lab.testName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lab.specimen} &middot; {lab.orderedBy}</div>
                    </div>
                    <Badge text={lab.status === 'completed' ? (lab.abnormal ? 'Abnormal' : 'Normal') : lab.status}
                      color={lab.status === 'pending' ? '#D97706' : lab.abnormal ? '#EF4444' : '#10B981'} />
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: expandedId === lab._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {expandedId === lab._id && lab.status === 'completed' && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border-medium)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--card-radius)', background: lab.abnormal ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)' }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Result</div>
                          <div className="stat-value" style={{ fontSize: 15, fontWeight: 700, color: lab.abnormal ? '#EF4444' : 'var(--text-primary)' }}>{lab.result}</div>
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
                          <AlertTriangle size={12} style={{ color: '#EF4444' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>Critical result — contact your provider immediately</span>
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

      {/* ═══ Immunizations ═══ */}
      {activeTab === 'immunizations' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Immunization Record</h2>
          <Empty icon={Syringe} text="Immunization data is loaded from the facility system. Visit your nearest health center to view or update your vaccination record." />
        </div>
      )}

      {/* ═══ Messages ═══ */}
      {activeTab === 'messages' && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Messages</h2>
          <Empty icon={MessageSquare} text="No messages from your healthcare providers yet. Messages will appear here when your doctor or facility sends you updates." />
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowBooking(false); }} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card-solid)', borderRadius: 8, padding: 24,
            width: '100%', maxWidth: 'min(460px, calc(100vw - 32px))', maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Request Appointment</h3>
              <button onClick={() => setShowBooking(false)} style={{ width: 28, height: 28, borderRadius: 'var(--card-radius)', background: 'var(--overlay-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>Submit a request and the facility will confirm within 24 hours.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  );
}

/* ─── Helpers ─── */
function SH({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <Icon size={14} style={{ color: '#0077D7' }} />
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
  font-size: 26px; font-weight: 700; color: var(--text-primary);
  letter-spacing: -0.01em; margin-bottom: 6px;
}
.pp-subtitle {
  font-family: 'Inter', 'DM Sans', Helvetica, sans-serif;
  font-size: 15px; color: var(--text-secondary); line-height: 1.5;
}
.pp-card {
  background: var(--bg-card-solid); border: 1px solid var(--border-medium);
  border-radius: 6px; box-shadow: var(--card-shadow);
}
.pp-toggle {
  display: flex; margin-bottom: 22px; border-radius: 4px;
  overflow: hidden; border: 1px solid var(--border-medium);
}
.pp-toggle__btn {
  flex: 1; padding: 10px 0; font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 13px; font-weight: 700; border: none; cursor: pointer;
  background: var(--bg-secondary); color: var(--text-secondary); transition: all 0.2s ease;
}
.pp-toggle__btn--active {
  background: var(--accent-primary); color: #fff;
}
.pp-field { margin-bottom: 16px; }
.pp-label {
  display: block; font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 6px; letter-spacing: 0;
  text-transform: none;
}
.pp-input {
  width: 100%; padding: 12px 14px; border-radius: 4px;
  border: 1px solid var(--border-medium); font-family: 'Inter', 'DM Sans', sans-serif;
  font-size: 15px; color: var(--text-primary); background: var(--bg-card-solid);
  transition: border-color 0.2s; outline: none;
}
.pp-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0,119,215,0.1); }
.pp-input::placeholder { color: var(--text-muted); }
.pp-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 13px 24px; border-radius: 4px;
  font-family: 'Inter', 'DM Sans', sans-serif; font-size: 15px;
  font-weight: 700; cursor: pointer; border: 2px solid var(--accent-primary);
  background: var(--accent-primary); color: #fff; transition: all 0.2s ease;
}
.pp-btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.pp-error {
  padding: 10px 12px; border-radius: 4px; background: rgba(218,18,48,0.08);
  border: 1px solid rgba(218,18,48,0.2); margin-bottom: 14px;
  display: flex; gap: 8px; align-items: flex-start;
  font-size: 12px; color: #DA1230;
}
.pp-notice {
  margin-top: 18px; padding: 12px 14px; border-radius: 4px;
  background: var(--accent-light); border: 1px solid var(--accent-border);
  display: flex; gap: 8px; align-items: flex-start;
  font-size: 12px; color: var(--text-secondary); line-height: 1.5;
}
.pp-demo-btn {
  display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
  background: var(--bg-card-solid); border: 1px solid var(--border-medium);
  border-radius: 4px; cursor: pointer; text-align: left; width: 100%;
  transition: all 0.15s ease;
}
.pp-demo-btn:hover { border-color: var(--accent-primary); background: var(--accent-light); }
`;
