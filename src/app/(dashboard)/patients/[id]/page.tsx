'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import SendMessageModal from '@/components/SendMessageModal';
import {
  ArrowLeft, Stethoscope, ArrowRightLeft, Phone, MapPin,
  Heart, AlertTriangle, FileText, FlaskConical,
  Pill, Activity, Droplets, Brain, ChevronDown, ChevronUp,
  ShieldAlert, TestTubes, MessageSquare, ChevronRight
} from 'lucide-react';
import { usePatients } from '@/lib/hooks/usePatients';
import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { usePatientReferrals } from '@/lib/hooks/useReferrals';
import { Package, Clock, Building2 as Building2Icon } from 'lucide-react';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAI, setExpandedAI] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);

  const { patients, loading } = usePatients();
  const { hospitals } = useHospitals();

  const patient = patients.find(p => p._id === id);
  const { records } = useMedicalRecords(patient?._id);
  const { referrals: patientReferrals } = usePatientReferrals(patient?._id);

  if (loading || !patient) {
    return (
      <>
        <TopBar title="Patient Record" />
        <main className="page-container flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading patient...' : 'Patient not found.'}
          </p>
        </main>
      </>
    );
  }

  const age = patient.estimatedAge || (patient.dateOfBirth ? (new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : 0);
  const regHospital = hospitals.find(h => h._id === patient.registrationHospital);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'history', label: 'Medical History', icon: FileText },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'labs', label: 'Lab Results', icon: FlaskConical },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'referrals', label: 'Referrals', icon: ArrowRightLeft },
  ];

  const latestVitals = records[0]?.vitalSigns;

  return (
    <>
      <TopBar title="Patient Record" />
      <main className="page-container page-enter">
          <button onClick={() => router.push('/patients')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--taban-blue)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </button>

          {/* Patient Header */}
          <div className="card-elevated p-5 mb-4">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-md flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ background: patient.gender === 'Male' ? 'var(--taban-blue)' : 'var(--taban-sky)' }}>
                {(patient.firstName || '?')[0]}{(patient.surname || '?')[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold">
                    {patient.firstName} {patient.middleName} {patient.surname}
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,119,215,0.12)', color: 'var(--taban-blue)' }}>
                    {patient.hospitalNumber}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>{age} years · {patient.gender}</span>
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> {patient.bloodType}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patient.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {patient.county}, {patient.state}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {patient.allergies?.length > 0 && patient.allergies[0] !== 'None known' && patient.allergies.map(a => (
                    <span key={a} className="badge badge-emergency text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> Allergy: {a}
                    </span>
                  ))}
                  {patient.chronicConditions?.length > 0 && patient.chronicConditions[0] !== 'None' && patient.chronicConditions.map(c => (
                    <span key={c} className="badge badge-warning text-[10px]">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => router.push('/consultation')} className="btn btn-primary btn-sm">
                  <Stethoscope className="w-4 h-4" /> New Consultation
                </button>
                <button onClick={() => setShowMessageModal(true)} className="btn btn-secondary btn-sm">
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
                <button onClick={() => router.push('/referrals')} className="btn btn-secondary btn-sm">
                  <ArrowRightLeft className="w-4 h-4" /> Refer
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border-light)' }}>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {/* Latest Vitals */}
                <div className="card-elevated p-5">
                  <h3 className="font-semibold text-sm mb-4">Latest Vital Signs</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {latestVitals && [
                      { label: 'Temperature', value: `${latestVitals.temperature}°C`, warn: latestVitals.temperature > 37.5 },
                      { label: 'Blood Pressure', value: `${latestVitals.systolic}/${latestVitals.diastolic}`, warn: latestVitals.systolic > 140 },
                      { label: 'Pulse', value: `${latestVitals.pulse} bpm`, warn: latestVitals.pulse > 100 },
                      { label: 'Resp. Rate', value: `${latestVitals.respiratoryRate}/min`, warn: latestVitals.respiratoryRate > 20 },
                      { label: 'SpO₂', value: `${latestVitals.oxygenSaturation}%`, warn: latestVitals.oxygenSaturation < 95 },
                      { label: 'Weight', value: `${latestVitals.weight} kg`, warn: false },
                      { label: 'Height', value: `${latestVitals.height} cm`, warn: false },
                      { label: 'BMI', value: latestVitals.bmi.toString(), warn: latestVitals.bmi > 30 || latestVitals.bmi < 18.5 },
                    ].map(v => (
                      <div key={v.label} className="p-3 rounded-lg" style={{ background: v.warn ? 'rgba(229,46,66,0.14)' : 'var(--overlay-subtle)' }}>
                        <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{v.label}</p>
                        <p className="text-lg font-bold" style={{ color: v.warn ? 'var(--taban-red)' : 'var(--text-primary)' }}>{v.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Visits */}
                <div className="card-elevated">
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 className="font-semibold text-sm">Recent Encounters</h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--table-row-border)' }}>
                    {records.slice(0, 4).map(rec => {
                      const ai = (rec as unknown as Record<string, unknown>).aiEvaluation as { suggestedDiagnoses: { icd10Code: string; name: string; confidence: number; reasoning: string; severity: string; suggestedTreatment?: string }[]; vitalSignAlerts: string[]; recommendedTests: string[]; severityAssessment: string; clinicalNotes: string; evaluatedAt: string } | undefined;
                      const isAIExpanded = expandedAI.has(rec._id);
                      return (
                      <div key={rec._id} className="p-4 hover:bg-white/[0.03]">
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
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{rec.visitDate}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.hospitalName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(rec.diagnoses || []).map((d, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,119,215,0.12)', color: 'var(--taban-blue)' }}>
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
                                  <ShieldAlert className="w-3.5 h-3.5" style={{ color: ai.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : ai.severityAssessment.includes('MODERATE') ? '#FCD34D' : 'var(--taban-green)' }} />
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
                                  <div className="text-xs" style={{ color: '#F59E0B' }}>
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
              <div className="space-y-4">
                <div className="card-elevated p-4">
                  <h3 className="font-semibold text-sm mb-3">Demographics</h3>
                  <div className="space-y-2.5">
                    {[
                      { l: 'Tribe', v: patient.tribe },
                      { l: 'Language', v: patient.primaryLanguage },
                      { l: 'Registered', v: patient.registrationDate },
                      { l: 'Facility', v: regHospital?.name || 'N/A' },
                      { l: 'Next of Kin', v: `${patient.nokName} (${patient.nokRelationship})` },
                      { l: 'NOK Phone', v: patient.nokPhone },
                    ].map(item => (
                      <div key={item.l} className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.l}</span>
                        <span className="text-xs font-medium text-right max-w-[60%] truncate">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--taban-red)' }} />
                    Allergies
                  </h3>
                  <div className="space-y-1.5">
                    {(patient.allergies || ['None known']).map(a => (
                      <div key={a} className="px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ background: a === 'None known' ? 'var(--overlay-subtle)' : 'rgba(229,46,66,0.14)', color: a === 'None known' ? 'var(--text-secondary)' : '#F87171' }}>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated p-4">
                  <h3 className="font-semibold text-sm mb-3">Chronic Conditions</h3>
                  <div className="space-y-1.5">
                    {(patient.chronicConditions || ['None']).map(c => (
                      <div key={c} className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: c === 'None' ? 'var(--overlay-subtle)' : 'rgba(252,211,77,0.14)', color: c === 'None' ? 'var(--text-secondary)' : '#FCD34D' }}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated p-4">
                  <h3 className="font-semibold text-sm mb-3">Current Medications</h3>
                  {records[0]?.prescriptions?.map((p, i) => (
                    <div key={i} className="mb-2 last:mb-0 p-2 rounded" style={{ background: 'var(--overlay-subtle)' }}>
                      <p className="text-sm font-medium">{p.drugName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.dose} · {p.route} · {p.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'history' && (
            <div className="card-elevated">
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <h3 className="font-semibold text-sm">Complete Medical History Timeline</h3>
              </div>
              <div className="relative pl-8">
                {records.map((rec, i) => {
                  const ai = (rec as unknown as Record<string, unknown>).aiEvaluation as { suggestedDiagnoses: { icd10Code: string; name: string; confidence: number; reasoning: string; severity: string; suggestedTreatment?: string }[]; vitalSignAlerts: string[]; recommendedTests: string[]; severityAssessment: string; clinicalNotes: string; evaluatedAt: string } | undefined;
                  const isAIExpanded = expandedAI.has(rec._id + '-history');
                  return (
                  <div key={rec._id} className="relative pb-6 last:pb-4">
                    {i < records.length - 1 && <div className="absolute left-[-20px] top-6 bottom-0 w-0.5" style={{ background: 'var(--border-light)' }} />}
                    <div className="absolute left-[-24px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{
                      background: rec.visitType === 'emergency' ? 'var(--taban-red)' : 'var(--taban-blue)',
                      borderColor: 'var(--bg-card)'
                    }} />
                    <div className="p-4 rounded-lg border ml-2" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{rec.visitDate}</span>
                          <span className={`badge text-[10px] ${rec.visitType === 'emergency' ? 'badge-emergency' : rec.visitType === 'inpatient' ? 'badge-warning' : 'badge-normal'}`}>
                            {rec.visitType}
                          </span>
                          {ai && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                              <Brain className="w-3 h-3" /> AI
                            </span>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.hospitalName}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{rec.chiefComplaint}</p>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{rec.historyOfPresentIllness.slice(0, 150)}...</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(rec.diagnoses || []).map((d, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,119,215,0.12)', color: 'var(--taban-blue)' }}>
                            {d.icd10Code} {d.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.providerName} · {rec.department}</p>
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
                                <ShieldAlert className="w-3.5 h-3.5" style={{ color: ai.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : ai.severityAssessment.includes('MODERATE') ? '#FCD34D' : 'var(--taban-green)' }} />
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
                );})}
              </div>
            </div>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div className="card-elevated overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lab Results</span>
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
                      <td className={lab.abnormal ? 'font-semibold' : ''} style={{ color: lab.abnormal ? (lab.critical ? '#EF4444' : '#F59E0B') : 'inherit' }}>
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
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Prescriptions</span>
                <button onClick={() => router.push('/pharmacy')} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--taban-blue)' }}>
                  View in Pharmacy <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {records.map(rec => (
                <div key={rec._id} className="card-elevated">
                  <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                    <div>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{rec.visitDate}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{rec.hospitalName}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.providerName}</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--table-row-border)' }}>
                    {(rec.prescriptions || []).map((rx, i) => (
                      <div key={i} className="px-4 py-3 flex items-center gap-4">
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
                        <td style={{ color: v.temperature > 37.5 ? '#EF4444' : 'inherit', fontWeight: v.temperature > 37.5 ? 600 : 400 }}>{v.temperature}</td>
                        <td style={{ color: v.systolic > 140 ? '#EF4444' : 'inherit', fontWeight: v.systolic > 140 ? 600 : 400 }}>{v.systolic}/{v.diastolic}</td>
                        <td style={{ color: v.pulse > 100 ? '#EF4444' : 'inherit' }}>{v.pulse}</td>
                        <td>{v.respiratoryRate}</td>
                        <td style={{ color: v.oxygenSaturation < 95 ? '#EF4444' : 'inherit' }}>{v.oxygenSaturation}%</td>
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
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Referral History</span>
                <button onClick={() => router.push('/referrals')} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--taban-blue)' }}>
                  View in Referrals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {patientReferrals.length === 0 ? (
                <div className="card-elevated p-6 text-center">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No referral history for this patient.</p>
                </div>
              ) : (
                patientReferrals.map(ref => {
                  const tp = ref.transferPackage as { medicalRecords?: unknown[]; labResults?: unknown[]; attachments?: unknown[]; packageSizeBytes?: number } | undefined;
                  const refAtts = ref.referralAttachments as unknown[] | undefined;
                  return (
                    <div key={ref._id} className="card-elevated p-4">
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
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,119,215,0.12)', color: 'var(--taban-blue)', border: '1px solid rgba(0,119,215,0.2)' }}>
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
