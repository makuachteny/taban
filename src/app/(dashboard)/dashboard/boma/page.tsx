'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import SymptomChecker from '@/components/SymptomChecker';
import { useApp } from '@/lib/context';
import { useBomaVisits } from '@/lib/hooks/useBomaVisits';
import { useFollowUps } from '@/lib/hooks/useFollowUps';
import type { PatientDoc } from '@/lib/db-types';
import {
  Home, Users, Plus, Check, ArrowRight, MapPin, Search,
  Heart, AlertTriangle, Clock, ChevronRight, X,
  Thermometer, Droplets, Baby, Bandage, Brain, Wind, Activity,
  Apple, Stethoscope, CircleAlert, CheckCircle2, Pill, FlaskConical,
  Skull, HelpCircle, Send, Loader2, Mic, MicOff,
} from 'lucide-react';
import { evaluatePatient, type PatientInput } from '@/lib/ai/diagnosis-engine';
import type { AIEvaluation } from '@/lib/db-types';

const ACCENT = '#2B6FE0';

const CONDITIONS = [
  { id: 'malaria', label: 'Malaria', icon: Thermometer, color: '#EF4444' },
  { id: 'diarrhea', label: 'Diarrhea', icon: Droplets, color: '#3B82F6' },
  { id: 'pneumonia', label: 'Pneumonia', icon: Stethoscope, color: '#8B5CF6' },
  { id: 'malnutrition', label: 'Malnutrition', icon: Apple, color: '#F59E0B' },
  { id: 'pregnancy', label: 'Pregnancy Issue', icon: Baby, color: '#EC4899' },
  { id: 'injury', label: 'Injury', icon: Bandage, color: '#FB923C' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: '#06B6D4' },
  { id: 'other', label: 'Other', icon: CircleAlert, color: '#64748B' },
];

// Signs & symptoms the BHW can observe/report
const SYMPTOM_GROUPS = [
  { id: 'fever', label: 'Fever / Hot Body', icon: Thermometer, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', keywords: 'fever headache chills sweating body ache' },
  { id: 'diarrhea', label: 'Diarrhea / Vomiting', icon: Droplets, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', keywords: 'diarrhea vomiting watery stool dehydration loose stool' },
  { id: 'cough', label: 'Cough / Breathing', icon: Wind, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', keywords: 'cough difficulty breathing shortness of breath chest pain' },
  { id: 'skin', label: 'Rash / Skin Problem', icon: Activity, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', keywords: 'rash skin red eyes measles itching swelling' },
  { id: 'weakness', label: 'Weakness / Pale', icon: Heart, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', keywords: 'fatigue weakness pale pallor dizzy weight loss' },
  { id: 'pregnancy', label: 'Pregnancy Problem', icon: Baby, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', keywords: 'pregnant bleeding swelling headache blurred vision edema' },
  { id: 'pain', label: 'Belly / Body Pain', icon: AlertTriangle, color: '#F97316', bg: 'rgba(249,115,22,0.1)', keywords: 'abdominal pain body pain burning urination' },
  { id: 'malnutrition', label: 'Not Eating / Thin', icon: Apple, color: '#D97706', bg: 'rgba(217,119,6,0.1)', keywords: 'weight loss malnutrition wasting not eating swollen feet' },
  { id: 'injury', label: 'Injury / Wound', icon: Bandage, color: '#FB923C', bg: 'rgba(251,146,60,0.1)', keywords: 'injury wound cut fracture bleeding trauma' },
  { id: 'mental', label: 'Confusion / Mood', icon: Brain, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', keywords: 'confusion anxiety depression mood seizure convulsion' },
];

const FACILITIES = [
  'Juba Teaching Hospital',
  'Wau State Hospital',
  'Malakal Teaching Hospital',
  'Bentiu State Hospital',
  'Bor State Hospital',
  'Nearest PHCU',
];

type VisitFormStep = 'closed' | 'search' | 'patient' | 'symptoms' | 'evaluation' | 'action' | 'done';

export default function BomaDashboardPage() {
  const { currentUser } = useApp();
  const workerId = currentUser?._id || '';
  const { todaysVisits, stats, loading, createVisit } = useBomaVisits(workerId);
  const { followUps, updateFollowUp, loading: followUpsLoading } = useFollowUps(workerId);
  const router = useRouter();

  const [formStep, setFormStep] = useState<VisitFormStep>('closed');
  const [visitForm, setVisitForm] = useState({
    patientName: '',
    geocodeId: '',
    condition: '',
    action: '' as '' | 'treated' | 'referred',
    referredTo: '',
    treatmentGiven: '',
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Patient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientDoc[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced patient search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      const { searchPatients: searchFn } = await import('@/lib/services/patient-service');
      const results = await searchFn(value.trim());
      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
  }, []);

  // Select a patient from search results → skip to symptoms
  const handleSelectPatient = useCallback((patient: PatientDoc) => {
    const fullName = [patient.firstName, patient.middleName, patient.surname].filter(Boolean).join(' ');
    setVisitForm(prev => ({
      ...prev,
      patientName: fullName,
      geocodeId: patient.geocodeId || prev.geocodeId,
    }));
    setSearchQuery('');
    setSearchResults([]);
    setFormStep('symptoms');
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSubmitVisit = useCallback(async () => {
    if (!currentUser || submitting) return;
    setSubmitting(true);
    try {
      const conditionLabel = CONDITIONS.find(c => c.id === visitForm.condition)?.label || visitForm.condition;
      await createVisit({
        workerId: currentUser._id,
        workerName: currentUser.name,
        assignedBoma: 'KJ',
        geocodeId: visitForm.geocodeId || `BOMA-KJ-HH${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: visitForm.patientName,
        visitDate: new Date().toISOString(),
        chiefComplaint: conditionLabel,
        suspectedCondition: conditionLabel,
        action: visitForm.action as 'treated' | 'referred',
        referredTo: visitForm.action === 'referred' ? visitForm.referredTo : undefined,
        treatmentGiven: visitForm.action === 'treated' ? visitForm.treatmentGiven : undefined,
        outcome: 'unknown',
        followUpRequired: true,
        state: 'Central Equatoria',
        county: 'Kajo-keji',
        payam: 'Kajo-keji',
        boma: 'Kajo-keji',
      });
      setFormStep('done');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormStep('closed');
        setVisitForm({ patientName: '', geocodeId: '', condition: '', action: '', referredTo: '', treatmentGiven: '' });
        setSelectedSymptoms([]);
        setAiEvaluation(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to save visit:', err);
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, visitForm, submitting, createVisit]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const runAiEvaluation = useCallback(() => {
    if (selectedSymptoms.length === 0) return;
    setEvaluating(true);

    const chiefComplaint = selectedSymptoms
      .map(id => SYMPTOM_GROUPS.find(g => g.id === id)?.keywords || '')
      .join(' ');

    const hasFever = selectedSymptoms.includes('fever');
    const hasCough = selectedSymptoms.includes('cough');
    const hasPregnancy = selectedSymptoms.includes('pregnancy');

    const input: PatientInput = {
      chiefComplaint,
      vitals: {
        temperature: hasFever ? 38.5 : 37.0,
        systolic: hasPregnancy ? 150 : 120,
        diastolic: hasPregnancy ? 95 : 80,
        pulse: hasFever ? 105 : 80,
        respiratoryRate: hasCough ? 26 : 18,
        oxygenSaturation: hasCough ? 93 : 98,
        weight: 60,
        height: 165,
        muac: selectedSymptoms.includes('malnutrition') ? 11.0 : undefined,
      },
      age: 25,
      gender: 'Male',
      physicalExam: {
        general: selectedSymptoms.includes('weakness') ? 'pallor, lethargic' : 'alert',
        cardiovascular: '',
        respiratory: hasCough ? 'crackles, reduced breath sounds' : 'clear',
        abdominal: selectedSymptoms.includes('pain') ? 'tender abdomen' : 'soft, non-tender',
        neurological: '',
      },
      chronicConditions: [],
      allergies: [],
    };

    setTimeout(() => {
      const result = evaluatePatient(input);
      setAiEvaluation(result);
      // Auto-map top diagnosis to a condition
      const topDx = result.suggestedDiagnoses[0];
      if (topDx) {
        const condId = CONDITIONS.find(c =>
          topDx.name.toLowerCase().includes(c.label.toLowerCase()) ||
          c.label.toLowerCase().includes(topDx.name.toLowerCase().split(' ')[0])
        )?.id || 'other';
        setVisitForm(prev => ({ ...prev, condition: condId }));
      }
      setFormStep('evaluation');
      setEvaluating(false);
    }, 800);
  }, [selectedSymptoms]);

  const handleFollowUpAction = useCallback(async (id: string, action: 'recovered' | 'died' | 'under_treatment' | 'lost_to_followup') => {
    const status = action === 'recovered' || action === 'died' ? 'completed' as const : action === 'lost_to_followup' ? 'lost_to_followup' as const : 'active' as const;
    const outcome = action === 'lost_to_followup' ? undefined : action;
    await updateFollowUp(id, { status, outcome, completedDate: new Date().toISOString() });
  }, [updateFollowUp]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (typeof window !== 'undefined' && (window as any).__bhwRecognition) {
        (window as any).__bhwRecognition.stop();
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } else {
      setIsRecording(true);
      setVoiceTranscript('');
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setVoiceTranscript(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        (window as any).__bhwRecognition = recognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
    }
  }, [isRecording]);

  if (!currentUser) return null;

  const displayName = currentUser.name.split(' ').pop() || currentUser.name;
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening';
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const _todayTreated = todaysVisits.filter(v => v.action === 'treated').length;
  const todayReferred = todaysVisits.filter(v => v.action === 'referred').length;
  void _todayTreated;
  const pendingFollowUps = followUps.filter(f => f.status === 'active' || f.status === 'missed');

  return (
    <>
      <TopBar title="Boma Health Worker" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* HEADER with inline pill buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-primary)' }}>
              <Home className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {greeting}, {displayName}
              </h1>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Boma KJ · {todayDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Households', value: stats?.uniqueHouseholds.toString() || '40', icon: Home, accent: '#2B6FE0' },
            { label: 'Seen Today', value: todaysVisits.length.toString(), icon: Users, accent: '#3B82F6' },
            { label: 'Follow-Ups', value: pendingFollowUps.length.toString(), icon: Clock, accent: '#F59E0B' },
            { label: 'Referrals', value: todayReferred.toString(), icon: ArrowRight, accent: '#EF4444' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="relative px-3 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => { if (kpi.label === 'Referrals') router.push('/referrals'); }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: kpi.accent }} />
              <div className="flex items-center justify-between mb-1">
                <span className="uppercase text-[9px] font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${kpi.accent}15` }}>
                  <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.accent }} />
                </div>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{loading ? '\u2014' : kpi.value}</span>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS — Find Patient + Add Patient side by side */}
        {formStep === 'closed' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setFormStep('search')}
              className="rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent-primary)', color: 'white', boxShadow: `0 4px 20px ${ACCENT}40` }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Find Patient</p>
                <p className="text-xs opacity-80">Search & start visit</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/patients/new')}
              className="rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98]"
              style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-primary)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}15` }}>
                <Users className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Add New Patient</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Register patient</p>
              </div>
            </button>
          </div>
        )}

        {/* VISIT FORM */}
        {formStep !== 'closed' && formStep !== 'done' && (
          <div className="rounded-2xl mb-4 overflow-hidden" style={{
            background: 'var(--bg-card)',
            border: `2px solid ${ACCENT}`,
            boxShadow: `0 4px 24px ${ACCENT}20`,
          }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: `${ACCENT}10` }}>
              <div className="flex items-center gap-2">
                {formStep === 'search' ? <Search className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} /> : <Plus className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />}
                <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {formStep === 'search' ? 'Find Patient' : formStep === 'patient' ? 'New Patient Details' : formStep === 'symptoms' ? 'Signs & Symptoms' : formStep === 'evaluation' ? 'AI Diagnosis' : 'Take Action'}
                </span>
              </div>
              <button onClick={() => { setFormStep('closed'); setVisitForm({ patientName: '', geocodeId: '', condition: '', action: '', referredTo: '', treatmentGiven: '' }); setSelectedSymptoms([]); setAiEvaluation(null); setSearchQuery(''); setSearchResults([]); }}>
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="p-4">
              {/* SEARCH STEP — find existing patient */}
              {formStep === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      placeholder="Search by name, geocode, phone..."
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-base"
                      style={{ background: 'var(--bg-input)', border: '2px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '48px' }}
                    />
                  </div>

                  {/* Search results list */}
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {searchLoading && (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Searching...</span>
                      </div>
                    )}
                    {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                      <div className="text-center py-6">
                        <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No patients found</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try a different name or register a new patient</p>
                      </div>
                    )}
                    {!searchLoading && searchQuery.trim().length < 2 && (
                      <div className="text-center py-6">
                        <Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Type at least 2 characters to search</p>
                      </div>
                    )}
                    {!searchLoading && searchResults.length > 0 && (
                      <div className="space-y-1.5">
                        {searchResults.map(patient => {
                          const fullName = [patient.firstName, patient.middleName, patient.surname].filter(Boolean).join(' ');
                          const initials = `${patient.firstName?.[0] || ''}${patient.surname?.[0] || ''}`.toUpperCase();
                          const age = patient.dateOfBirth
                            ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                            : patient.estimatedAge;
                          return (
                            <button
                              key={patient._id}
                              onClick={() => handleSelectPatient(patient)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
                              style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                                style={{ background: ACCENT }}
                              >
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {patient.geocodeId && (
                                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{patient.geocodeId}</span>
                                  )}
                                  {patient.hospitalNumber && (
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{patient.hospitalNumber}</span>
                                  )}
                                </div>
                              </div>
                              {age != null && (
                                <span className="text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                                  {age}y {patient.gender?.[0]}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* New patient option */}
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => setFormStep('patient')}
                      className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      style={{ background: 'var(--overlay-subtle)', border: '2px dashed var(--border-medium)', color: 'var(--text-secondary)' }}
                    >
                      <Plus className="w-4 h-4" /> Enter new patient manually
                    </button>
                  </div>
                </div>
              )}

              {/* PATIENT STEP — manual entry for new patients */}
              {formStep === 'patient' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Patient Name</label>
                    <input
                      type="text"
                      value={visitForm.patientName}
                      onChange={e => setVisitForm(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="e.g. Deng Mabior"
                      className="w-full px-4 py-3 rounded-xl text-base"
                      style={{ background: 'var(--bg-input)', border: '2px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '48px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Geocode ID</label>
                    <input
                      type="text"
                      value={visitForm.geocodeId}
                      onChange={e => setVisitForm(prev => ({ ...prev, geocodeId: e.target.value.toUpperCase() }))}
                      placeholder="BOMA-XX-HH1001"
                      className="w-full px-4 py-3 rounded-xl text-base font-mono"
                      style={{ background: 'var(--bg-input)', border: '2px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '48px' }}
                    />
                  </div>
                  {/* Inline voice transcript note */}
                  {voiceTranscript && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                      <Mic className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-info)' }} />
                      <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>
                        {voiceTranscript}
                      </p>
                      <button onClick={() => setVoiceTranscript('')} className="flex-shrink-0">
                        <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => visitForm.patientName && setFormStep('symptoms')}
                    disabled={!visitForm.patientName}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: visitForm.patientName ? 'var(--accent-primary)' : '#94A3B8', minHeight: '56px', fontSize: '16px' }}
                  >
                    Next: Signs & Symptoms <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {formStep === 'symptoms' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        What signs & symptoms does the patient have?
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tap all that apply</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShowSymptomChecker(!showSymptomChecker)}
                        className="flex items-center gap-1.5 px-3 rounded-full transition-all active:scale-95"
                        style={{
                          height: '32px',
                          background: showSymptomChecker ? `${ACCENT}15` : 'var(--bg-card)',
                          border: showSymptomChecker ? `2px solid ${ACCENT}` : '1px solid var(--border-light)',
                          boxShadow: 'var(--card-shadow)',
                        }}
                      >
                        <Stethoscope className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span className="text-[11px] font-semibold" style={{ color: showSymptomChecker ? 'var(--accent-primary)' : 'var(--text-primary)' }}>AI</span>
                      </button>
                      <button
                        onClick={handleVoiceToggle}
                        className="flex items-center gap-1.5 px-3 rounded-full transition-all active:scale-95"
                        style={{
                          height: '32px',
                          background: isRecording ? 'var(--color-danger)' : 'var(--bg-card)',
                          border: isRecording ? '2px solid var(--color-danger)' : '1px solid var(--border-light)',
                          boxShadow: 'var(--card-shadow)',
                        }}
                      >
                        {isRecording
                          ? <MicOff className="w-3.5 h-3.5 text-white" />
                          : <Mic className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
                        }
                        <span className="text-[11px] font-semibold" style={{ color: isRecording ? 'white' : 'var(--text-primary)' }}>
                          {isRecording ? 'Stop' : 'Voice'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {SYMPTOM_GROUPS.map(group => {
                      const isSelected = selectedSymptoms.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleSymptom(group.id)}
                          className="flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.97]"
                          style={{
                            background: isSelected ? group.bg : 'var(--overlay-subtle)',
                            border: isSelected ? `2px solid ${group.color}` : '2px solid var(--border-light)',
                          }}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: isSelected ? group.color : 'var(--overlay-medium)' }}>
                            <group.icon className="w-4 h-4" style={{ color: isSelected ? 'white' : group.color }} />
                          </div>
                          <span className="text-xs font-semibold flex-1" style={{ color: isSelected ? group.color : 'var(--text-primary)' }}>
                            {group.label}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: group.color }} />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={runAiEvaluation}
                    disabled={selectedSymptoms.length === 0 || evaluating}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{
                      background: selectedSymptoms.length > 0 ? '#059669' : '#94A3B8',
                      minHeight: '56px',
                      fontSize: '16px',
                      boxShadow: selectedSymptoms.length > 0 ? '0 4px 16px rgba(5,150,105,0.3)' : 'none',
                    }}
                  >
                    {evaluating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing symptoms...</>
                    ) : (
                      <><Stethoscope className="w-5 h-5" /> Evaluate ({selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''}) <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              )}

              {formStep === 'evaluation' && aiEvaluation && (
                <div>
                  {/* Severity banner */}
                  <div className="p-3 rounded-xl mb-3" style={{
                    background: aiEvaluation.severityAssessment.includes('HIGH')
                      ? 'rgba(239,68,68,0.1)' : aiEvaluation.severityAssessment.includes('MODERATE')
                        ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${aiEvaluation.severityAssessment.includes('HIGH')
                      ? 'rgba(239,68,68,0.2)' : aiEvaluation.severityAssessment.includes('MODERATE')
                        ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" style={{
                        color: aiEvaluation.severityAssessment.includes('HIGH') ? '#EF4444'
                          : aiEvaluation.severityAssessment.includes('MODERATE') ? '#F59E0B' : '#10B981',
                      }} />
                      <span className="text-xs font-bold" style={{
                        color: aiEvaluation.severityAssessment.includes('HIGH') ? '#EF4444'
                          : aiEvaluation.severityAssessment.includes('MODERATE') ? '#F59E0B' : '#10B981',
                      }}>
                        {aiEvaluation.severityAssessment.split(' \u2014 ')[0]}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {aiEvaluation.severityAssessment.split(' \u2014 ')[1]}
                    </p>
                  </div>

                  {/* Top diagnoses */}
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    AI Suggested Conditions
                  </p>
                  <div className="space-y-2 mb-3">
                    {aiEvaluation.suggestedDiagnoses.slice(0, 3).map((dx, i) => (
                      <div key={dx.icd10Code} className="p-3 rounded-xl" style={{
                        background: i === 0 ? 'rgba(5,150,105,0.06)' : 'var(--overlay-subtle)',
                        border: i === 0 ? '1px solid rgba(5,150,105,0.2)' : '1px solid var(--border-light)',
                      }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                              background: i === 0 ? '#059669' : 'var(--overlay-medium)',
                              color: i === 0 ? 'white' : 'var(--text-muted)',
                            }}>#{i + 1}</span>
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{dx.name}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                            background: dx.severity === 'severe' ? 'rgba(239,68,68,0.1)' : dx.severity === 'moderate' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            color: dx.severity === 'severe' ? '#EF4444' : dx.severity === 'moderate' ? '#F59E0B' : '#10B981',
                          }}>{dx.severity}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--overlay-medium)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${dx.confidence}%`,
                              background: dx.confidence >= 60 ? '#059669' : dx.confidence >= 40 ? '#F59E0B' : 'var(--text-muted)',
                            }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{dx.confidence}%</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Pill className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#059669' }} />
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{dx.suggestedTreatment}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended tests */}
                  {aiEvaluation.recommendedTests.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Recommended Tests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiEvaluation.recommendedTests.map(test => (
                          <span key={test} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <FlaskConical className="w-2.5 h-2.5" /> {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What should I do? */}
                  <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#059669' }}>
                      <ChevronRight className="w-3 h-3 inline" /> What should I do?
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {aiEvaluation.severityAssessment.includes('HIGH')
                        ? 'REFER IMMEDIATELY to the nearest facility. Give first aid and arrange transport.'
                        : aiEvaluation.severityAssessment.includes('MODERATE')
                          ? 'Consider referral if you cannot treat. Monitor closely. Follow up within 24 hours.'
                          : 'You can treat at community level. Follow the suggestions above. Follow up in 2-3 days.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setFormStep('action')}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: 'var(--accent-primary)', minHeight: '56px', fontSize: '16px' }}
                  >
                    Next: Take Action <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-[9px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                    AI suggestion based on WHO/IMCI guidelines. Use your clinical judgment.
                  </p>
                </div>
              )}

              {formStep === 'action' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>What action was taken?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setVisitForm(prev => ({ ...prev, action: 'treated' }))}
                      className="p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: visitForm.action === 'treated' ? 'var(--accent-primary)' : 'var(--overlay-subtle)',
                        border: visitForm.action === 'treated' ? `3px solid ${ACCENT}` : '2px solid var(--border-medium)',
                        color: visitForm.action === 'treated' ? 'white' : 'var(--text-primary)',
                        minHeight: '100px',
                      }}
                    >
                      <CheckCircle2 className="w-10 h-10" />
                      <span className="text-lg font-bold">TREATED</span>
                      <span className="text-xs opacity-70">Patient treated here</span>
                    </button>
                    <button
                      onClick={() => setVisitForm(prev => ({ ...prev, action: 'referred' }))}
                      className="p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: visitForm.action === 'referred' ? 'var(--color-danger)' : 'var(--overlay-subtle)',
                        border: visitForm.action === 'referred' ? '3px solid var(--color-danger)' : '2px solid var(--border-medium)',
                        color: visitForm.action === 'referred' ? 'white' : 'var(--text-primary)',
                        minHeight: '100px',
                      }}
                    >
                      <Send className="w-10 h-10" />
                      <span className="text-lg font-bold">REFERRED</span>
                      <span className="text-xs opacity-70">Sent to facility</span>
                    </button>
                  </div>

                  {visitForm.action === 'treated' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Treatment Given</label>
                      <input
                        type="text"
                        value={visitForm.treatmentGiven}
                        onChange={e => setVisitForm(prev => ({ ...prev, treatmentGiven: e.target.value }))}
                        placeholder="e.g. ORS, Coartem, Paracetamol"
                        className="w-full px-4 py-3 rounded-xl text-base"
                        style={{ background: 'var(--bg-input)', border: '2px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '48px' }}
                      />
                    </div>
                  )}

                  {visitForm.action === 'referred' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Referred To</label>
                      <select
                        value={visitForm.referredTo}
                        onChange={e => setVisitForm(prev => ({ ...prev, referredTo: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-base"
                        style={{ background: 'var(--bg-input)', border: '2px solid var(--border-medium)', color: 'var(--text-primary)', minHeight: '48px' }}
                      >
                        <option value="">Select facility</option>
                        {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  )}

                  {visitForm.action && (
                    <button
                      onClick={handleSubmitVisit}
                      disabled={submitting}
                      className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      style={{ background: 'var(--accent-primary)', minHeight: '56px', fontSize: '16px', boxShadow: `0 4px 16px ${ACCENT}40`, opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                      {submitting ? 'Saving...' : 'Save Visit'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {showSuccess && (
          <div className="rounded-2xl p-5 mb-4 flex items-center gap-3" style={{ background: 'var(--accent-primary)', color: 'white' }}>
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Visit Saved</p>
              <p className="text-sm opacity-80">{visitForm.patientName} — {CONDITIONS.find(c => c.id === visitForm.condition)?.label}</p>
            </div>
          </div>
        )}

        {/* Symptom Checker — compact */}
        {showSymptomChecker && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ background: `${ACCENT}08`, borderBottom: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>AI Symptom Checker</span>
              </div>
              <button onClick={() => setShowSymptomChecker(false)}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <SymptomChecker
              patientName={visitForm.patientName || undefined}
              onDiagnosisComplete={(evaluation) => {
                const topDx = evaluation.suggestedDiagnoses[0];
                if (topDx) {
                  const condId = CONDITIONS.find(c =>
                    topDx.name.toLowerCase().includes(c.label.toLowerCase()) ||
                    c.label.toLowerCase().includes(topDx.name.toLowerCase().split(' ')[0])
                  )?.id || 'other';
                  setVisitForm(prev => ({ ...prev, condition: condId }));
                }
              }}
            />
          </div>
        )}

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* FOLLOW-UP QUEUE */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Follow-Up Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#F59E0B20', color: 'var(--color-warning)' }}>
                  {followUpsLoading ? '\u2014' : pendingFollowUps.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {!followUpsLoading && pendingFollowUps.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All follow-ups complete</p>
                </div>
              )}
              {pendingFollowUps.map(fu => (
                <div key={fu._id} className="p-3 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fu.patientName}</p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{fu.geocodeId || '\u2014'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: CONDITIONS.find(c => c.label === fu.condition)?.color || '#64748B' }}>{fu.condition}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {fu.scheduledDate ? Math.floor((Date.now() - new Date(fu.scheduledDate).getTime()) / 86400000) : 0} days ago
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button onClick={() => handleFollowUpAction(fu._id, 'recovered')}
                      className="py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95"
                      style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, minHeight: '48px' }}>
                      <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-[9px] font-bold" style={{ color: 'var(--accent-primary)' }}>WELL</span>
                    </button>
                    <button onClick={() => handleFollowUpAction(fu._id, 'under_treatment')}
                      className="py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95"
                      style={{ background: '#F59E0B15', border: '1px solid #F59E0B30', minHeight: '48px' }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                      <span className="text-[9px] font-bold" style={{ color: 'var(--color-warning)' }}>SICK</span>
                    </button>
                    <button onClick={() => handleFollowUpAction(fu._id, 'died')}
                      className="py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95"
                      style={{ background: '#EF444415', border: '1px solid #EF444430', minHeight: '48px' }}>
                      <Skull className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                      <span className="text-[9px] font-bold" style={{ color: 'var(--color-danger)' }}>DIED</span>
                    </button>
                    <button onClick={() => handleFollowUpAction(fu._id, 'lost_to_followup')}
                      className="py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95"
                      style={{ background: '#64748B15', border: '1px solid #64748B30', minHeight: '48px' }}>
                      <HelpCircle className="w-4 h-4" style={{ color: '#64748B' }} />
                      <span className="text-[9px] font-bold" style={{ color: '#64748B' }}>LOST</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TODAY'S VISITS LOG */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Today&apos;s Visits</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${ACCENT}15`, color: 'var(--accent-primary)' }}>
                  {todaysVisits.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-1.5" style={{ maxHeight: '440px', overflowY: 'auto' }}>
              {todaysVisits.length === 0 && !loading && (
                <div className="text-center py-6">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No visits today yet</p>
                </div>
              )}
              {todaysVisits.map(visit => (
                <div key={visit._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
                  background: 'var(--overlay-subtle)',
                  border: '1px solid var(--border-light)',
                }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: visit.action === 'treated' ? 'var(--accent-primary)' : 'var(--color-danger)' }}>
                    {visit.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{visit.patientName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{visit.geocodeId}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{visit.chiefComplaint}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{
                      background: visit.action === 'treated' ? `${ACCENT}15` : '#EF444415',
                      color: visit.action === 'treated' ? 'var(--accent-primary)' : 'var(--color-danger)',
                    }}>
                      {visit.action === 'treated' ? 'TREATED' : 'REFERRED'}
                    </span>
                    <p className="text-[9px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(visit.visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
