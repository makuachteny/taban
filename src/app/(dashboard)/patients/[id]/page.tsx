'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import SendMessageModal from '@/components/SendMessageModal';
import {
  ArrowLeft, Stethoscope, ArrowRightLeft,
  Heart, AlertTriangle, FileText, FlaskConical,
  Pill, Activity, Brain, ChevronDown, ChevronUp,
  ShieldAlert, TestTubes, MessageSquare, ChevronRight,
  CalendarClock, UserPlus, TrendingUp as TrendingUpIcon, ClipboardList,
  User as UserIcon, Building2, Search, X, Printer,
} from 'lucide-react';
import { usePatients } from '@/lib/hooks/usePatients';
import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { usePatientReferrals } from '@/lib/hooks/useReferrals';
import { useLabResults } from '@/lib/hooks/useLabResults';
import { useImmunizations } from '@/lib/hooks/useImmunizations';
import { Package, Clock, Building2 as Building2Icon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import VitalsTrends from '@/components/VitalsTrends';
import { formatDateTime } from '@/lib/format-utils';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAI, setExpandedAI] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Full History filters & expansion
  const [historySearch, setHistorySearch] = useState('');
  const [historyRange, setHistoryRange] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [historyVisitType, setHistoryVisitType] = useState<'all' | 'outpatient' | 'inpatient' | 'emergency'>('all');
  const [expandedEncounters, setExpandedEncounters] = useState<Set<string>>(new Set());

  const { t } = useTranslation();
  const { patients, loading } = usePatients();
  const { hospitals } = useHospitals();

  const patient = patients.find(p => p._id === id);
  const { records } = useMedicalRecords(patient?._id);
  const { referrals: patientReferrals } = usePatientReferrals(patient?._id);
  const { results: allLabResults } = useLabResults();
  const { immunizations: allImmunizations } = useImmunizations();

  // ── Filtered Full History ──────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const cutoff = historyRange === '30d'
      ? now - 30 * 86400_000
      : historyRange === '90d'
      ? now - 90 * 86400_000
      : historyRange === '1y'
      ? now - 365 * 86400_000
      : 0;
    const q = historySearch.trim().toLowerCase();
    return records.filter(r => {
      // Time filter
      if (cutoff > 0) {
        const ts = new Date(r.consultedAt || r.visitDate).getTime();
        if (Number.isNaN(ts) || ts < cutoff) return false;
      }
      // Visit type filter
      if (historyVisitType !== 'all' && r.visitType !== historyVisitType) return false;
      // Search across complaint, history, diagnoses, provider, department
      if (q) {
        const haystack = [
          r.chiefComplaint,
          r.historyOfPresentIllness,
          r.providerName,
          r.department,
          r.hospitalName,
          ...(r.diagnoses || []).map(d => `${d.icd10Code} ${d.name}`),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, historyRange, historyVisitType, historySearch]);

  if (loading || !patient) {
    return (
      <>
        <TopBar title="Patient Record" />
        <main className="page-container flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? t('status.loading') : t('patient.notFound')}
          </p>
        </main>
      </>
    );
  }

  const age = patient.estimatedAge || (patient.dateOfBirth ? (new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : 0);
  const regHospital = hospitals.find(h => h._id === patient.registrationHospital);

  // Counts for the "Related Records" sidebar card
  const consultationsCount = records.length;
  const activeReferralsCount = (patientReferrals || []).filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
  const labOrdersCount = (allLabResults || []).filter(r => r.patientId === patient._id).length;
  const immunizationsCount = (allImmunizations || []).filter(i => i.patientId === patient._id).length;
  const prescriptionsCount = records.reduce((sum, r) => sum + (r.prescriptions?.length || 0), 0);

  const tabs = [
    { id: 'overview', label: t('tab.overview'), icon: Heart },
    { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
    { id: 'history', label: 'Full History', icon: FileText },
    { id: 'vitals', label: t('tab.vitals'), icon: Activity },
    { id: 'labs', label: t('tab.labResults'), icon: FlaskConical },
    { id: 'prescriptions', label: t('tab.prescriptions'), icon: Pill },
    { id: 'referrals', label: t('tab.referrals'), icon: ArrowRightLeft },
  ];

  // records[] is sorted newest-first by the service layer.
  const latestRecord = records[0];
  const latestVitals = latestRecord?.vitalSigns;
  const latestDiagnosis = latestRecord?.diagnoses?.[0];

  // Prefer explicit timestamp fields, fall back to legacy date-only values.
  const registeredAtDisplay = formatDateTime(patient.registeredAt || patient.registrationDate);
  const lastConsultedRaw = patient.lastConsultedAt
    || latestRecord?.consultedAt
    || latestRecord?.visitDate
    || patient.lastVisitDate;
  const lastConsultedDisplay = formatDateTime(lastConsultedRaw);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, .no-print * { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .card-elevated { box-shadow: none !important; border: 1px solid #ccc !important; page-break-inside: avoid; }
          .page-container { padding: 0 !important; max-width: 100% !important; }
          .badge { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; }
          a, button { color: inherit !important; }
          @page { margin: 12mm; }
        }
      ` }} />
      <TopBar title="Patient Record" />
      <main className="page-container page-enter">
          <button onClick={() => router.push('/patients')} className="flex items-center gap-1.5 text-sm mb-4 no-print" style={{ color: 'var(--taban-blue)' }}>
            <ArrowLeft className="w-4 h-4" /> {t('action.back')}
          </button>

          {/* Patient Header */}
          <div className="card-elevated px-5 py-4 mb-5 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Name + hospital number */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {patient.firstName} {patient.middleName} {patient.surname}
                  </h1>
                  <span
                    className="font-mono text-[11px] px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)', fontWeight: 600 }}
                  >
                    {patient.hospitalNumber}
                  </span>
                </div>

                {/* Demographics chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {age} yrs
                  </span>
                  <span
                    className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: patient.gender === 'Male' ? 'rgba(43,111,224,0.10)' : 'rgba(236,72,153,0.10)',
                      color: patient.gender === 'Male' ? 'var(--taban-blue)' : '#BE185D',
                    }}
                  >
                    {patient.gender}
                  </span>
                  {patient.state && (
                    <span
                      className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                    >
                      {patient.state}
                    </span>
                  )}
                  {patient.allergies?.length > 0 && patient.allergies[0] !== 'None known' && (
                    <span className="badge badge-emergency text-[10px] flex-shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Allergy: {patient.allergies.join(', ')}
                    </span>
                  )}
                </div>

                {/* Timeline meta */}
                <div
                  className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t text-[11px]"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}
                >
                  <span className="flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    <span>Registered: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{registeredAtDisplay}</span></span>
                    {patient.registeredBy && <span className="opacity-70">by {patient.registeredBy}</span>}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    <span>Last consultation: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{lastConsultedDisplay}</span></span>
                    {patient.lastConsultedBy && <span className="opacity-70">by {patient.lastConsultedBy}</span>}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 no-print">
                <button onClick={() => router.push(`/consultation?patientId=${patient._id}`)} className="btn btn-primary btn-sm">
                  <Stethoscope className="w-4 h-4" /> {t('action.newConsultation')}
                </button>
                <button onClick={() => setShowMessageModal(true)} className="btn btn-secondary btn-sm">
                  <MessageSquare className="w-4 h-4" /> {t('action.sendMessage')}
                </button>
                <button onClick={() => router.push('/referrals')} className="btn btn-secondary btn-sm">
                  <ArrowRightLeft className="w-4 h-4" /> {t('action.refer')}
                </button>
                <button
                  onClick={() => { if (typeof window !== 'undefined') window.print(); }}
                  className="btn btn-secondary btn-sm"
                  title="Print patient summary"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b mb-5 no-print" style={{ borderColor: 'var(--border-light)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'tab-active' : ''}`}
                style={{ color: activeTab === tab.id ? 'var(--taban-blue)' : 'var(--text-muted)' }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                {/* Most Recent Record — hero card, first thing the doctor sees */}
                <div
                  className="card-elevated overflow-hidden relative"
                  style={{
                    boxShadow: '0 8px 32px -12px rgba(43,111,224,0.18), 0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Decorative gradient corner */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute', top: 0, right: 0,
                      width: 200, height: 160, pointerEvents: 'none',
                      background: 'radial-gradient(ellipse at top right, rgba(43,111,224,0.08), transparent 70%)',
                    }}
                  />

                  {/* Header: title + date + CTA */}
                  <div
                    className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2 relative"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent-light)' }}
                      >
                        <ClipboardList className="w-3.5 h-3.5" style={{ color: 'var(--taban-blue)' }} />
                      </div>
                      <h3 className="font-semibold text-sm">Most Recent Record</h3>
                      {latestRecord && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)' }}
                        >
                          <CalendarClock className="w-3 h-3" />
                          {formatDateTime(latestRecord.consultedAt || latestRecord.visitDate)}
                        </span>
                      )}
                      {latestRecord?.visitType && (
                        <span
                          className={`badge text-[10px] ${
                            latestRecord.visitType === 'emergency'
                              ? 'badge-emergency'
                              : latestRecord.visitType === 'inpatient'
                              ? 'badge-warning'
                              : 'badge-normal'
                          }`}
                        >
                          {latestRecord.visitType}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--accent-light)]"
                      style={{ color: 'var(--taban-blue)', border: '1px solid var(--accent-border)' }}
                    >
                      View Full History <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {latestRecord ? (
                    <div className="p-5 space-y-4 relative">
                      {/* Hero: chief complaint + diagnosis pill */}
                      <div
                        className="rounded-xl p-4"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-light) 0%, transparent 100%)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                          style={{ color: 'var(--taban-blue)' }}
                        >
                          <Stethoscope className="w-3 h-3" /> Chief complaint
                        </p>
                        <p className="text-base font-semibold leading-snug mb-3" style={{ color: 'var(--text-primary)' }}>
                          {latestRecord.chiefComplaint || '—'}
                        </p>
                        {latestDiagnosis && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                              Diagnosis
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                background: 'var(--bg-card)',
                                color: 'var(--taban-blue)',
                                border: '1px solid var(--accent-border)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              }}
                            >
                              <span
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--accent-light)' }}
                              >
                                {latestDiagnosis.icd10Code}
                              </span>
                              {latestDiagnosis.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Provider / metadata chip row */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        {latestRecord.providerName && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                          >
                            <UserIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {latestRecord.providerName}
                            </span>
                          </span>
                        )}
                        {latestRecord.department && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                          >
                            <Activity className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            {latestRecord.department}
                          </span>
                        )}
                        {latestRecord.hospitalName && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                          >
                            <Building2 className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            {latestRecord.hospitalName}
                          </span>
                        )}
                      </div>

                      {/* Clinical blocks: medications + treatment plan */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          className="rounded-xl p-3.5"
                          style={{
                            background: 'var(--overlay-subtle)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Pill className="w-3 h-3" style={{ color: 'var(--taban-blue)' }} />
                            Current medications
                          </p>
                          {(latestRecord.prescriptions || []).length > 0 ? (
                            <ul className="space-y-1.5">
                              {(latestRecord.prescriptions || []).slice(0, 4).map((p, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs">
                                  <span
                                    className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ background: 'var(--taban-blue)' }}
                                  />
                                  <span>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {p.drugName}
                                    </span>{' '}
                                    <span style={{ color: 'var(--text-muted)' }}>
                                      · {p.dose} · {p.frequency}
                                    </span>
                                  </span>
                                </li>
                              ))}
                              {(latestRecord.prescriptions || []).length > 4 && (
                                <li className="text-[10px] pl-2.5" style={{ color: 'var(--text-muted)' }}>
                                  +{(latestRecord.prescriptions || []).length - 4} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None prescribed</p>
                          )}
                        </div>

                        <div
                          className="rounded-xl p-3.5"
                          style={{
                            background: 'var(--overlay-subtle)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <ClipboardList className="w-3 h-3" style={{ color: 'var(--taban-blue)' }} />
                            Treatment plan
                          </p>
                          {latestRecord.treatmentPlan ? (
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {latestRecord.treatmentPlan}
                            </p>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No plan recorded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center relative">
                      <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No consultations recorded yet for this patient.
                      </p>
                    </div>
                  )}
                </div>

                {/* Latest Vitals */}
                <div className="card-elevated">
                  <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">{t('vitals.title')}</h3>
                    <button
                      onClick={() => setActiveTab('trends')}
                      className="text-xs font-medium flex items-center gap-1"
                      style={{ color: 'var(--taban-blue)' }}
                    >
                      <TrendingUpIcon className="w-3.5 h-3.5" /> View Trends
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {latestVitals && [
                        { label: t('vitals.temperature'), value: `${latestVitals.temperature}°C`, warn: latestVitals.temperature > 37.5 },
                        { label: t('vitals.bloodPressure'), value: `${latestVitals.systolic}/${latestVitals.diastolic}`, warn: latestVitals.systolic > 140 },
                        { label: t('vitals.pulse'), value: `${latestVitals.pulse} bpm`, warn: latestVitals.pulse > 100 },
                        { label: t('vitals.respRate'), value: `${latestVitals.respiratoryRate}/min`, warn: latestVitals.respiratoryRate > 20 },
                        { label: t('vitals.spo2'), value: `${latestVitals.oxygenSaturation}%`, warn: latestVitals.oxygenSaturation < 95 },
                        { label: t('vitals.weight'), value: `${latestVitals.weight} kg`, warn: false },
                        { label: t('vitals.height'), value: `${latestVitals.height} cm`, warn: false },
                        { label: t('vitals.bmi'), value: latestVitals.bmi.toString(), warn: latestVitals.bmi > 30 || latestVitals.bmi < 18.5 },
                      ].map(v => (
                        <div key={v.label} className="p-3 rounded-lg" style={{ background: v.warn ? 'rgba(229,46,66,0.14)' : 'var(--overlay-subtle)' }}>
                          <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{v.label}</p>
                          <p className="text-lg font-bold" style={{ color: v.warn ? 'var(--taban-red)' : 'var(--text-primary)' }}>{v.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Visits */}
                <div className="card-elevated">
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">{t('encounters.recent')}</h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--table-row-border)' }}>
                    {records.slice(0, 4).map(rec => {
                      const ai = (rec as unknown as Record<string, unknown>).aiEvaluation as { suggestedDiagnoses: { icd10Code: string; name: string; confidence: number; reasoning: string; severity: string; suggestedTreatment?: string }[]; vitalSignAlerts: string[]; recommendedTests: string[]; severityAssessment: string; clinicalNotes: string; evaluatedAt: string } | undefined;
                      const isAIExpanded = expandedAI.has(rec._id);
                      return (
                      <div key={rec._id} className="px-5 py-4 hover:bg-white/[0.03]">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`badge text-[10px] ${rec.visitType === 'emergency' ? 'badge-emergency' : rec.visitType === 'inpatient' ? 'badge-warning' : 'badge-normal'}`}>
                                {rec.visitType}
                              </span>
                              <span className="text-sm font-medium">{rec.department}</span>
                              {ai && (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                                  <Brain className="w-3 h-3" /> AI Evaluated
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1">{rec.chiefComplaint}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatDateTime(rec.consultedAt || rec.visitDate)}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.hospitalName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(rec.diagnoses || []).map((d, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)' }}>
                              {d.icd10Code} {d.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          Provider: {rec.providerName} · {rec.providerRole}
                        </p>
                        {ai && (
                          <>
                            <button
                              onClick={() => setExpandedAI(prev => {
                                const next = new Set(prev);
                                if (next.has(rec._id)) next.delete(rec._id); else next.add(rec._id);
                                return next;
                              })}
                              className="flex items-center gap-1 text-xs mt-2 font-medium"
                              style={{ color: '#8B5CF6' }}
                            >
                              <Brain className="w-3 h-3" />
                              {isAIExpanded ? 'Hide' : 'View'} AI Evaluation
                              {isAIExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isAIExpanded && (
                              <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className="w-3.5 h-3.5" style={{ color: ai.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : ai.severityAssessment.includes('MODERATE') ? 'var(--color-warning)' : 'var(--taban-green)' }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{ai.severityAssessment}</span>
                                </div>
                                {ai.suggestedDiagnoses.slice(0, 3).map(dx => (
                                  <div key={dx.icd10Code} className="flex items-center gap-2 text-xs">
                                    <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: '10px' }}>{dx.icd10Code}</span>
                                    <span className="font-medium">{dx.name}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>({dx.confidence}%)</span>
                                  </div>
                                ))}
                                {ai.vitalSignAlerts.length > 0 && (
                                  <div className="text-xs" style={{ color: 'var(--color-warning)' }}>
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    {ai.vitalSignAlerts.length} vital sign alert(s)
                                  </div>
                                )}
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ai.clinicalNotes}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              </div>

              {/* Sidebar info */}
              <div className="space-y-5">
                {/* ── Related Records (deep links) ── */}
                <div className="card-elevated">
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
                    <ClipboardList className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="font-semibold text-sm">Related Records</h3>
                  </div>
                  <div className="p-3 space-y-1">
                    {[
                      {
                        icon: FileText,
                        label: 'Past Consultations',
                        count: consultationsCount,
                        action: () => setActiveTab('history'),
                      },
                      {
                        icon: ArrowRightLeft,
                        label: 'Active Referrals',
                        count: activeReferralsCount,
                        action: () => setActiveTab('referrals'),
                      },
                      {
                        icon: FlaskConical,
                        label: 'Lab Orders',
                        count: labOrdersCount,
                        action: () => setActiveTab('labs'),
                      },
                      {
                        icon: Pill,
                        label: 'Prescriptions',
                        count: prescriptionsCount,
                        action: () => setActiveTab('prescriptions'),
                      },
                      {
                        icon: Heart,
                        label: 'Immunizations',
                        count: immunizationsCount,
                        action: () => router.push(`/immunizations`),
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--accent-light)] text-left"
                          title={`View ${item.label}`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--accent-light)' }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                          </div>
                          <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center"
                            style={{
                              background: item.count > 0 ? 'var(--accent-primary)' : 'var(--overlay-subtle)',
                              color: item.count > 0 ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            {item.count}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="card-elevated">
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">{t('patient.demographics')}</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { l: t('patient.phone'), v: patient.phone },
                      { l: t('patient.bloodType'), v: patient.bloodType },
                      { l: t('patient.location'), v: `${patient.county}, ${patient.state}` },
                      { l: t('patient.tribe'), v: patient.tribe },
                      { l: t('patient.language'), v: patient.primaryLanguage },
                      { l: t('patient.registered'), v: registeredAtDisplay },
                      { l: t('patient.facility'), v: regHospital?.name || 'N/A' },
                      { l: t('patient.nextOfKin'), v: `${patient.nokName} (${patient.nokRelationship})` },
                      { l: t('patient.nokPhone'), v: patient.nokPhone },
                    ].map(item => (
                      <div key={item.l} className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.l}</span>
                        <span className="text-xs font-medium text-right max-w-[60%] truncate">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated">
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--taban-red)' }} />
                    <h3 className="font-semibold text-sm">{t('patient.allergies')}</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {(patient.allergies || ['None known']).map(a => (
                      <div key={a} className="px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ background: a === 'None known' ? 'var(--overlay-subtle)' : 'rgba(229,46,66,0.14)', color: a === 'None known' ? 'var(--text-secondary)' : '#F87171' }}>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated">
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">{t('patient.chronicConditions')}</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {(patient.chronicConditions || ['None']).map(c => (
                      <div key={c} className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: c === 'None' ? 'var(--overlay-subtle)' : 'rgba(252,211,77,0.14)', color: c === 'None' ? 'var(--text-secondary)' : 'var(--color-warning)' }}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated">
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">{t('patient.medications')}</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {records[0]?.prescriptions?.map((p, i) => (
                      <div key={i} className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                        <p className="text-sm font-medium">{p.drugName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.dose} · {p.route} · {p.frequency}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4" style={{ color: 'var(--taban-blue)' }} />
                    Vital Sign Trends
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Chronological trends across all recorded visits. Colored badges flag
                    readings outside the normal range or moving quickly.
                  </p>
                </div>
              </div>
              <VitalsTrends records={records} />
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'history' && (
            <div className="card-elevated">
              <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-light)' }}
                  >
                    <FileText className="w-4 h-4" style={{ color: 'var(--taban-blue)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t('encounters.history')}</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Showing {filteredHistory.length} of {records.length} encounter{records.length === 1 ? '' : 's'}, most recent first
                    </p>
                  </div>
                </div>
                {records.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <CalendarClock className="w-3 h-3" />
                    First visit: {formatDateTime(records[records.length - 1]?.consultedAt || records[records.length - 1]?.visitDate)}
                  </span>
                )}
              </div>

              {/* Filter bar */}
              {records.length > 0 && (
                <div
                  className="px-5 py-3 border-b flex items-center gap-2 flex-wrap"
                  style={{ borderColor: 'var(--border-light)', background: 'var(--overlay-subtle)' }}
                >
                  {/* Search */}
                  <div
                    className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
                  >
                    <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search by complaint, diagnosis, ICD-10, or provider…"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    {historySearch && (
                      <button
                        onClick={() => setHistorySearch('')}
                        className="flex-shrink-0"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    )}
                  </div>

                  {/* Time range */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                    {([
                      { v: 'all', l: 'All time' },
                      { v: '1y', l: 'Past year' },
                      { v: '90d', l: '90 days' },
                      { v: '30d', l: '30 days' },
                    ] as const).map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setHistoryRange(opt.v)}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        style={{
                          background: historyRange === opt.v ? 'var(--accent-light)' : 'transparent',
                          color: historyRange === opt.v ? 'var(--taban-blue)' : 'var(--text-muted)',
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>

                  {/* Visit type */}
                  <select
                    value={historyVisitType}
                    onChange={e => setHistoryVisitType(e.target.value as typeof historyVisitType)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg outline-none"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="all">All visit types</option>
                    <option value="outpatient">Outpatient</option>
                    <option value="inpatient">Inpatient</option>
                    <option value="emergency">Emergency</option>
                  </select>

                  {(historySearch || historyRange !== 'all' || historyVisitType !== 'all') && (
                    <button
                      onClick={() => { setHistorySearch(''); setHistoryRange('all'); setHistoryVisitType('all'); }}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
              {records.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No encounters recorded yet.</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-10 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No encounters match the current filters.</p>
                  <button
                    onClick={() => { setHistorySearch(''); setHistoryRange('all'); setHistoryVisitType('all'); }}
                    className="text-xs font-semibold mt-2"
                    style={{ color: 'var(--taban-blue)' }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
              <div className="relative px-6 py-5" style={{ paddingLeft: 56 }}>
                {/* Vertical spine */}
                <div
                  className="absolute top-5 bottom-5 w-0.5"
                  style={{
                    left: 32,
                    background: 'linear-gradient(180deg, var(--accent-border) 0%, var(--border-light) 100%)',
                  }}
                />
                {filteredHistory.map((rec) => {
                  const ai = (rec as unknown as Record<string, unknown>).aiEvaluation as { suggestedDiagnoses: { icd10Code: string; name: string; confidence: number; reasoning: string; severity: string; suggestedTreatment?: string }[]; vitalSignAlerts: string[]; recommendedTests: string[]; severityAssessment: string; clinicalNotes: string; evaluatedAt: string } | undefined;
                  const isAIExpanded = expandedAI.has(rec._id + '-history');
                  const isExpanded = expandedEncounters.has(rec._id);
                  const isEmergency = rec.visitType === 'emergency';
                  const isInpatient = rec.visitType === 'inpatient';
                  const markerColor = isEmergency ? 'var(--taban-red)' : isInpatient ? 'var(--color-warning)' : 'var(--taban-blue)';
                  const labCount = (rec.labResults || []).length;
                  const rxCount = (rec.prescriptions || []).length;
                  const toggleExpand = () => setExpandedEncounters(prev => {
                    const next = new Set(prev);
                    if (next.has(rec._id)) next.delete(rec._id); else next.add(rec._id);
                    return next;
                  });
                  return (
                  <div key={rec._id} className="relative pb-5 last:pb-0">
                    {/* Timeline marker */}
                    <button
                      onClick={toggleExpand}
                      className="absolute flex items-center justify-center"
                      style={{
                        left: -30,
                        top: 14,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--bg-card)',
                        border: `2px solid ${markerColor}`,
                        boxShadow: `0 0 0 4px var(--bg-card), 0 2px 8px ${markerColor}33`,
                        cursor: 'pointer',
                      }}
                      aria-label={isExpanded ? 'Collapse encounter' : 'Expand encounter'}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: markerColor,
                        }}
                      />
                    </button>

                    {/* Encounter card */}
                    <div
                      className="rounded-xl transition-all hover:shadow-md"
                      style={{
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-card)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Header strip — clickable to expand */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleExpand}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); } }}
                        className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:bg-[var(--accent-light)] transition-colors"
                        style={{
                          background: 'var(--overlay-subtle)',
                          borderBottom: '1px solid var(--border-light)',
                        }}
                        title={isExpanded ? 'Collapse details' : 'Click to view full record details'}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                          >
                            <CalendarClock className="w-3 h-3" style={{ color: markerColor }} />
                            {formatDateTime(rec.consultedAt || rec.visitDate)}
                          </span>
                          <span className={`badge text-[10px] ${isEmergency ? 'badge-emergency' : isInpatient ? 'badge-warning' : 'badge-normal'}`}>
                            {rec.visitType}
                          </span>
                          {ai && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                              <Brain className="w-3 h-3" /> AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {labCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)' }}>
                              <FlaskConical className="w-2.5 h-2.5" /> {labCount} lab{labCount === 1 ? '' : 's'}
                            </span>
                          )}
                          {rxCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)' }}>
                              <Pill className="w-2.5 h-2.5" /> {rxCount} rx
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4">
                        <p className="text-sm font-semibold leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                          {rec.chiefComplaint}
                        </p>
                        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {isExpanded
                            ? rec.historyOfPresentIllness
                            : `${rec.historyOfPresentIllness.slice(0, 180)}${rec.historyOfPresentIllness.length > 180 ? '…' : ''}`}
                        </p>
                        {(rec.diagnoses || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(rec.diagnoses || []).map((d, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'var(--bg-card)',
                                  color: 'var(--taban-blue)',
                                  border: '1px solid var(--accent-border)',
                                }}
                              >
                                <span className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--accent-light)' }}>
                                  {d.icd10Code}
                                </span>
                                {d.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{rec.providerName}</span>
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {rec.department}
                          </span>
                          {rec.hospitalName && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {rec.hospitalName}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Expanded details: vitals, treatment plan, prescriptions, labs */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px dashed var(--border-light)' }}>
                            {rec.vitalSigns && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  Vital signs at this visit
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {[
                                    { l: 'Temp', v: `${rec.vitalSigns.temperature}°C` },
                                    { l: 'BP', v: `${rec.vitalSigns.systolic}/${rec.vitalSigns.diastolic}` },
                                    { l: 'Pulse', v: `${rec.vitalSigns.pulse} bpm` },
                                    { l: 'SpO₂', v: `${rec.vitalSigns.oxygenSaturation}%` },
                                  ].map(v => (
                                    <div key={v.l} className="px-2 py-1.5 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{v.l}</p>
                                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{v.v}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {rec.treatmentPlan && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                  <ClipboardList className="w-3 h-3" style={{ color: 'var(--taban-blue)' }} />
                                  Treatment plan
                                </p>
                                <p className="text-xs leading-relaxed p-2.5 rounded-lg" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)' }}>
                                  {rec.treatmentPlan}
                                </p>
                              </div>
                            )}
                            {(rec.prescriptions || []).length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                  <Pill className="w-3 h-3" style={{ color: 'var(--taban-blue)' }} />
                                  Prescriptions ({rec.prescriptions!.length})
                                </p>
                                <ul className="space-y-1">
                                  {rec.prescriptions!.map((rx, k) => (
                                    <li key={k} className="text-xs flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                                      <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--taban-blue)' }} />
                                      <span>
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{rx.drugName}</span>{' '}
                                        <span style={{ color: 'var(--text-muted)' }}>· {rx.dose} · {rx.route} · {rx.frequency} · {rx.duration}</span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(rec.labResults || []).length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                  <FlaskConical className="w-3 h-3" style={{ color: 'var(--taban-blue)' }} />
                                  Lab results ({rec.labResults!.length})
                                </p>
                                <ul className="space-y-1">
                                  {rec.labResults!.map((lab, k) => (
                                    <li key={k} className="text-xs flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                                      <span className="font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{lab.testName}</span>
                                      <span className={lab.abnormal ? 'font-semibold' : ''} style={{ color: lab.abnormal ? (lab.critical ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--text-secondary)' }}>
                                        {lab.result} {lab.unit}
                                      </span>
                                      {lab.abnormal && (
                                        <span className={`badge text-[9px] ${lab.critical ? 'badge-emergency' : 'badge-warning'}`}>
                                          {lab.critical ? 'CRIT' : 'ABN'}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      {ai && (
                        <>
                          <button
                            onClick={() => setExpandedAI(prev => {
                              const next = new Set(prev);
                              const key = rec._id + '-history';
                              if (next.has(key)) next.delete(key); else next.add(key);
                              return next;
                            })}
                            className="flex items-center gap-1 text-xs mt-2 font-medium"
                            style={{ color: '#8B5CF6' }}
                          >
                            <Brain className="w-3 h-3" />
                            {isAIExpanded ? 'Hide' : 'View'} AI Evaluation
                            {isAIExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {isAIExpanded && (
                            <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-3.5 h-3.5" style={{ color: ai.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : ai.severityAssessment.includes('MODERATE') ? 'var(--color-warning)' : 'var(--taban-green)' }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{ai.severityAssessment}</span>
                              </div>
                              {ai.suggestedDiagnoses.slice(0, 3).map(dx => (
                                <div key={dx.icd10Code} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: '10px' }}>{dx.icd10Code}</span>
                                  <span className="font-medium">{dx.name}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>({dx.confidence}%)</span>
                                </div>
                              ))}
                              {ai.recommendedTests.length > 0 && (
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--taban-blue)' }}>
                                  <TestTubes className="w-3 h-3" />
                                  Recommended: {ai.recommendedTests.join(', ')}
                                </div>
                              )}
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ai.clinicalNotes}</p>
                            </div>
                          )}
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                );})}
              </div>
              )}
            </div>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div className="card-elevated overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('lab.title')}</span>
                <button onClick={() => router.push('/lab')} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--taban-blue)' }}>
                  View in Lab Module <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Unit</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.flatMap(r => (r.labResults || []).map(lab => ({ ...lab, visitDate: r.visitDate, hospital: r.hospitalName }))).map((lab, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{lab.date}</td>
                      <td className="font-medium text-sm">{lab.testName}</td>
                      <td className={lab.abnormal ? 'font-semibold' : ''} style={{ color: lab.abnormal ? (lab.critical ? 'var(--color-danger)' : 'var(--color-warning)') : 'inherit' }}>
                        {lab.result}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{lab.unit}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{lab.referenceRange}</td>
                      <td>
                        {lab.abnormal ? (
                          <span className={`badge text-[10px] ${lab.critical ? 'badge-emergency' : 'badge-warning'}`}>
                            {lab.critical ? 'CRITICAL' : 'Abnormal'}
                          </span>
                        ) : (
                          <span className="badge badge-normal text-[10px]">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Prescriptions</span>
                <button onClick={() => router.push('/pharmacy')} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--taban-blue)' }}>
                  View in Pharmacy <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {records.map(rec => (
                <div key={rec._id} className="card-elevated">
                  <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                    <div>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{rec.visitDate}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{rec.hospitalName}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.providerName}</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--table-row-border)' }}>
                    {(rec.prescriptions || []).map((rx, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-4">
                        <Pill className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--taban-blue)' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rx.drugName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {rx.dose} · {rx.route} · {rx.frequency} · {rx.duration}
                          </p>
                        </div>
                        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{rx.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="card-elevated overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Temp (°C)</th>
                    <th>BP (mmHg)</th>
                    <th>Pulse</th>
                    <th>Resp Rate</th>
                    <th>SpO₂</th>
                    <th>Weight (kg)</th>
                    <th>BMI</th>
                    <th>Facility</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(rec => rec.vitalSigns).map(rec => {
                    const v = rec.vitalSigns;
                    return (
                      <tr key={rec._id}>
                        <td className="font-mono text-xs">{rec.visitDate}</td>
                        <td style={{ color: v.temperature > 37.5 ? 'var(--color-danger)' : 'inherit', fontWeight: v.temperature > 37.5 ? 600 : 400 }}>{v.temperature}</td>
                        <td style={{ color: v.systolic > 140 ? 'var(--color-danger)' : 'inherit', fontWeight: v.systolic > 140 ? 600 : 400 }}>{v.systolic}/{v.diastolic}</td>
                        <td style={{ color: v.pulse > 100 ? 'var(--color-danger)' : 'inherit' }}>{v.pulse}</td>
                        <td>{v.respiratoryRate}</td>
                        <td style={{ color: v.oxygenSaturation < 95 ? 'var(--color-danger)' : 'inherit' }}>{v.oxygenSaturation}%</td>
                        <td>{v.weight}</td>
                        <td>{v.bmi}</td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{(rec.hospitalName || '').replace(' Hospital', '').replace(' Teaching', '')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('referral.title')}</span>
                <button onClick={() => router.push('/referrals')} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--taban-blue)' }}>
                  View in Referrals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {patientReferrals.length === 0 ? (
                <div className="card-elevated p-6 text-center">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('referral.none')}</p>
                </div>
              ) : (
                patientReferrals.map(ref => {
                  const tp = ref.transferPackage as { medicalRecords?: unknown[]; labResults?: unknown[]; attachments?: unknown[]; packageSizeBytes?: number } | undefined;
                  const refAtts = ref.referralAttachments as unknown[] | undefined;
                  return (
                    <div key={ref._id} className="card-elevated px-5 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge urgency-${ref.urgency} text-[10px]`}>
                            {ref.urgency === 'emergency' && <AlertTriangle className="w-3 h-3" />}
                            {ref.urgency.charAt(0).toUpperCase() + ref.urgency.slice(1)}
                          </span>
                          <span className={`badge ${ref.status === 'sent' ? 'ref-sent' : ref.status === 'received' ? 'ref-received' : ref.status === 'seen' ? 'ref-seen' : ref.status === 'completed' ? 'ref-completed' : 'ref-cancelled'} text-[10px]`}>
                            {ref.status === 'sent' ? 'Sent' : ref.status === 'received' ? 'Received' : ref.status === 'seen' ? 'Being Seen' : ref.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </span>
                          {tp && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-light)', color: 'var(--taban-blue)', border: '1px solid var(--accent-border)' }}>
                              <Package className="w-3 h-3" /> Data Package
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-3 h-3" />
                          {ref.referralDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Building2Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{ref.fromHospital}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span className="font-medium">{ref.toHospital}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--overlay-subtle)' }}>{ref.department}</span>
                      </div>
                      <p className="text-sm mb-1"><span className="font-medium">Reason:</span> {ref.reason}</p>
                      {ref.notes && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Notes: {ref.notes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>Dr. {ref.referringDoctor}</span>
                        {refAtts && refAtts.length > 0 && (
                          <span>{refAtts.length} attachment(s)</span>
                        )}
                        {tp && tp.medicalRecords && (
                          <span>{(tp.medicalRecords as unknown[]).length} record(s) in package</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
      </main>

      <SendMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        patient={patient ? { _id: patient._id, firstName: patient.firstName, middleName: patient.middleName, surname: patient.surname, phone: patient.phone } : null}
      />
    </>
  );
}
