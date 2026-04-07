'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import {
  ArrowLeft, Save, ChevronDown, ChevronUp, Search,
  Stethoscope, Thermometer, ClipboardList,
  FlaskConical, Pill, Calendar, Building2, FileText,
  X, AlertTriangle, UserSearch, Brain, Plus, Check,
  Activity, ShieldAlert, TestTubes, Sparkles, Paperclip,
  Mic,
} from 'lucide-react';
import { icd10Codes, medications } from '@/data/mock';
import type { Attachment } from '@/data/mock';
import FileUpload from '@/components/FileUpload';
import ClinicalScribe from '@/components/ClinicalScribe';
import type { ScribeExtraction } from '@/lib/services/clinical-scribe-service';
import { usePatients } from '@/lib/hooks/usePatients';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { evaluatePatient } from '@/lib/ai/diagnosis-engine';
import type { AIEvaluation } from '@/lib/db-types';

interface DiagnosisEntry {
  code: string;
  name: string;
  type: 'primary' | 'secondary';
  certainty: 'confirmed' | 'suspected';
  severity: 'mild' | 'moderate' | 'severe';
}

interface PrescriptionEntry {
  medication: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const labTests = [
  'Malaria RDT',
  'Full Blood Count',
  'Blood Glucose',
  'Urinalysis',
  'HIV Rapid Test',
  'CD4 Count',
  'Liver Function',
  'Renal Function',
];

const routeOptions = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Rectal', 'Inhaled'];
const frequencyOptions = ['OD (Once daily)', 'BD (Twice daily)', 'TDS (Three times daily)', 'QDS (Four times daily)', 'PRN (As needed)', 'STAT (Immediately)', 'Nocte (At night)'];

export default function ConsultationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // PouchDB hooks
  const { patients } = usePatients();
  const { hospitals } = useHospitals();
  const { currentUser } = useApp();

  // Section collapse state (11 sections — includes AI section at index 3 and Attachments at index 8)
  const [openSections, setOpenSections] = useState<boolean[]>([
    true, false, false, false, false, false, false, false, false, false, false,
  ]);

  // AI Clinical Scribe
  const [scribeOpen, setScribeOpen] = useState(false);

  // AI Evaluation state
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [acceptedDiagnoses, setAcceptedDiagnoses] = useState<Set<string>>(new Set());
  const [acceptedTests, setAcceptedTests] = useState<Set<string>>(new Set());

  // Patient selector
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Chief Complaint
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Vital Signs
  const [vitals, setVitals] = useState({
    temperature: '',
    systolic: '',
    diastolic: '',
    pulse: '',
    respRate: '',
    o2Sat: '',
    weight: '',
    height: '',
    muac: '',
  });

  // Physical Examination
  const [physExam, setPhysExam] = useState({
    general: '',
    cardiovascular: '',
    respiratory: '',
    abdominal: '',
    neurological: '',
  });

  // Diagnosis
  const [diagSearch, setDiagSearch] = useState('');
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);
  const [showDiagDropdown, setShowDiagDropdown] = useState(false);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntry[]>([]);
  const [rxMedSearch, setRxMedSearch] = useState('');
  const [showRxDropdown, setShowRxDropdown] = useState(false);

  // Lab Orders
  const [labOrders, setLabOrders] = useState<Record<string, boolean>>(
    Object.fromEntries(labTests.map(t => [t, false]))
  );

  // Treatment Plan
  const [treatmentPlan, setTreatmentPlan] = useState('');

  // Attachments
  const [consultAttachments, setConsultAttachments] = useState<Attachment[]>([]);

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');

  // Referral
  const [addReferral, setAddReferral] = useState(false);
  const [referralHospital, setReferralHospital] = useState('');
  const [referralUrgency, setReferralUrgency] = useState('routine');
  const [referralReason, setReferralReason] = useState('');

  // Medical records hook
  const { create: createRecord } = useMedicalRecords(selectedPatient || undefined);

  // Only doctors and clinical officers can create consultations
  if (currentUser && currentUser.role !== 'doctor' && currentUser.role !== 'clinical_officer') {
    return (
      <>
        <TopBar title="New Consultation" />
        <main className="page-container flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
              background: 'rgba(229,46,66,0.1)',
              border: '1px solid rgba(229,46,66,0.2)',
            }}>
              <ShieldAlert className="w-8 h-8" style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Access Restricted
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Only doctors and clinical officers can create consultations.
            </p>
            <button onClick={() => router.back()} className="btn btn-primary">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </main>
      </>
    );
  }

  const toggleSection = (index: number) => {
    setOpenSections(prev => prev.map((v, i) => (i === index ? !v : v)));
  };

  // Patient filtering
  const filteredPatients = patientSearch.length >= 1
    ? patients.filter(p =>
        `${p.firstName} ${p.middleName} ${p.surname}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.hospitalNumber.toLowerCase().includes(patientSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectedPatientData = selectedPatient ? patients.find(p => p._id === selectedPatient) : null;

  // ICD-10 filtering
  const filteredICD = diagSearch.length >= 1
    ? icd10Codes.filter(c =>
        c.code.toLowerCase().includes(diagSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(diagSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  // Medication filtering
  const filteredMeds = rxMedSearch.length >= 1
    ? medications.filter(m =>
        m.name.toLowerCase().includes(rxMedSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(rxMedSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const addDiagnosis = (code: string, name: string, sev?: 'mild' | 'moderate' | 'severe') => {
    if (diagnoses.find(d => d.code === code)) return;
    setDiagnoses(prev => [...prev, {
      code,
      name,
      type: prev.length === 0 ? 'primary' : 'secondary',
      certainty: 'confirmed',
      severity: sev || 'moderate',
    }]);
    setDiagSearch('');
    setShowDiagDropdown(false);
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(prev => prev.filter((_, i) => i !== index));
  };

  const updateDiagnosis = (index: number, field: keyof DiagnosisEntry, value: string) => {
    setDiagnoses(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const addPrescription = (medName: string) => {
    setPrescriptions(prev => [...prev, {
      medication: medName,
      dose: '',
      route: 'Oral',
      frequency: '',
      duration: '',
      instructions: '',
    }]);
    setRxMedSearch('');
    setShowRxDropdown(false);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof PrescriptionEntry, value: string) => {
    setPrescriptions(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    const hospital = currentUser?.hospital;
    const now = new Date().toISOString();
    const weight = parseFloat(vitals.weight) || 0;
    const height = parseFloat(vitals.height) || 0;
    const patientData = patients.find(p => p._id === selectedPatient);
    const patientName = patientData ? `${patientData.firstName} ${patientData.surname}` : '';
    const hospitalNumber = patientData?.hospitalNumber || '';
    const hospitalId = currentUser?.hospitalId || '';
    const hospitalName = hospital?.name || currentUser?.hospitalName || '';

    try {
      // 1. Create lab orders in taban_lab_results DB
      const selectedLabTests = Object.entries(labOrders).filter(([, checked]) => checked).map(([name]) => name);
      const labTestSpecimens: Record<string, string> = {
        'Malaria RDT': 'Blood', 'Full Blood Count': 'Blood', 'Blood Glucose': 'Blood',
        'Urinalysis': 'Urine', 'HIV Rapid Test': 'Blood', 'CD4 Count': 'Blood',
        'Liver Function': 'Blood', 'Renal Function': 'Blood',
      };
      if (selectedLabTests.length > 0) {
        const { createLabResult } = await import('@/lib/services/lab-service');
        for (const testName of selectedLabTests) {
          await createLabResult({
            patientId: selectedPatient,
            patientName,
            hospitalNumber,
            testName,
            specimen: labTestSpecimens[testName] || 'Blood',
            status: 'pending',
            result: '',
            unit: '',
            referenceRange: '',
            abnormal: false,
            critical: false,
            orderedBy: currentUser?.name || '',
            orderedAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            completedAt: '',
            hospitalId,
            hospitalName,
            orgId: currentUser?.organization?._id,
          });
        }
      }

      // 2. Create prescriptions in taban_prescriptions DB
      if (prescriptions.length > 0) {
        const { createPrescription } = await import('@/lib/services/prescription-service');
        for (const rx of prescriptions) {
          await createPrescription({
            patientId: selectedPatient,
            patientName,
            medication: rx.medication,
            dose: rx.dose,
            route: rx.route,
            frequency: rx.frequency,
            duration: rx.duration,
            prescribedBy: currentUser?.name || '',
            status: 'pending',
            hospitalId,
            hospitalName,
            orgId: currentUser?.organization?._id,
          });
        }
      }

      // 3. Build lab results summary for the medical record
      const labResultsSummary = selectedLabTests.map(testName => ({
        testName,
        result: '',
        unit: '',
        referenceRange: '',
        abnormal: false,
        critical: false,
        date: now.split('T')[0],
      }));

      // 4. Save the medical record with all data linked
      await createRecord({
        patientId: selectedPatient,
        hospitalId,
        hospitalName,
        visitDate: now.split('T')[0],
        visitType: 'outpatient',
        providerName: currentUser?.name || '',
        providerRole: currentUser?.role || 'doctor',
        department: 'Outpatient',
        chiefComplaint,
        historyOfPresentIllness: chiefComplaint,
        vitalSigns: {
          temperature: parseFloat(vitals.temperature) || 0,
          systolic: parseInt(vitals.systolic) || 0,
          diastolic: parseInt(vitals.diastolic) || 0,
          pulse: parseInt(vitals.pulse) || 0,
          respiratoryRate: parseInt(vitals.respRate) || 0,
          oxygenSaturation: parseInt(vitals.o2Sat) || 0,
          weight,
          height,
          bmi: weight && height ? parseFloat((weight / ((height / 100) ** 2)).toFixed(1)) : 0,
          muac: parseFloat(vitals.muac) || undefined,
          recordedAt: now,
        },
        diagnoses: diagnoses.map(d => ({ icd10Code: d.code, name: d.name, type: d.type, certainty: d.certainty, severity: d.severity })),
        prescriptions: prescriptions.map(rx => ({
          drugName: rx.medication,
          genericName: rx.medication,
          dose: rx.dose,
          route: rx.route,
          frequency: rx.frequency,
          duration: rx.duration,
          instructions: rx.instructions,
        })),
        labResults: labResultsSummary,
        treatmentPlan,
        attachments: consultAttachments.length > 0 ? consultAttachments : undefined,
        followUp: followUpDate ? { date: followUpDate, reason: followUpReason } : undefined,
        syncStatus: 'pending',
        aiEvaluation: aiEvaluation || undefined,
      });
      showToast('Consultation saved successfully!', 'success');
      router.push('/patients');
    } catch (err) {
      console.error('Failed to save consultation:', err);
      showToast('Failed to save consultation. Please try again.', 'error');
    }
  };

  const runAIEvaluation = () => {
    if (!selectedPatientData) return;
    setAiLoading(true);
    // Simulate slight delay for UX feedback
    setTimeout(() => {
      const age = selectedPatientData.estimatedAge || (selectedPatientData.dateOfBirth ? (new Date().getFullYear() - new Date(selectedPatientData.dateOfBirth).getFullYear()) : 0);
      const result = evaluatePatient({
        chiefComplaint,
        vitals: {
          temperature: parseFloat(vitals.temperature) || 0,
          systolic: parseInt(vitals.systolic) || 0,
          diastolic: parseInt(vitals.diastolic) || 0,
          pulse: parseInt(vitals.pulse) || 0,
          respiratoryRate: parseInt(vitals.respRate) || 0,
          oxygenSaturation: parseInt(vitals.o2Sat) || 0,
          weight: parseFloat(vitals.weight) || 0,
          height: parseFloat(vitals.height) || 0,
          muac: parseFloat(vitals.muac) || undefined,
        },
        age,
        gender: selectedPatientData.gender as 'Male' | 'Female',
        physicalExam: physExam,
        chronicConditions: selectedPatientData.chronicConditions || [],
        allergies: selectedPatientData.allergies || [],
      });
      setAiEvaluation(result);
      setAiLoading(false);
      setAcceptedDiagnoses(new Set());
      setAcceptedTests(new Set());
      // Auto-open the AI section
      setOpenSections(prev => prev.map((v, i) => i === 3 ? true : v));
    }, 300);
  };

  // Apply AI Clinical Scribe extraction to all form fields
  const applyScribeExtraction = (extraction: ScribeExtraction) => {
    // Chief Complaint
    if (extraction.chiefComplaint) {
      setChiefComplaint(extraction.chiefComplaint);
    }

    // Vitals
    const v = extraction.vitals;
    if (Object.values(v).some(val => val)) {
      setVitals(prev => ({
        temperature: v.temperature || prev.temperature,
        systolic: v.systolic || prev.systolic,
        diastolic: v.diastolic || prev.diastolic,
        pulse: v.pulse || prev.pulse,
        respRate: v.respRate || prev.respRate,
        o2Sat: v.o2Sat || prev.o2Sat,
        weight: v.weight || prev.weight,
        height: v.height || prev.height,
        muac: v.muac || prev.muac,
      }));
    }

    // Physical Exam findings
    if (extraction.examFindings.length > 0) {
      const examUpdate: Record<string, string> = {};
      for (const finding of extraction.examFindings) {
        const key = finding.system;
        examUpdate[key] = (examUpdate[key] ? examUpdate[key] + '; ' : '') + finding.finding;
      }
      setPhysExam(prev => ({
        general: examUpdate.general || prev.general,
        cardiovascular: examUpdate.cardiovascular || prev.cardiovascular,
        respiratory: examUpdate.respiratory || prev.respiratory,
        abdominal: examUpdate.abdominal || prev.abdominal,
        neurological: examUpdate.neurological || prev.neurological,
      }));
    }

    // Diagnoses — match against ICD-10 codes
    if (extraction.diagnoses.length > 0) {
      for (const dx of extraction.diagnoses) {
        // Try to match by hint code or name
        const icdMatch = dx.icd10Hint
          ? icd10Codes.find(c => c.code === dx.icd10Hint)
          : icd10Codes.find(c => c.name.toLowerCase().includes(dx.name.toLowerCase().split(' ')[0]));
        if (icdMatch && !diagnoses.some(d => d.code === icdMatch.code)) {
          addDiagnosis(icdMatch.code, icdMatch.name);
        }
      }
    }

    // Medications — match against medication list
    if (extraction.medications.length > 0) {
      for (const med of extraction.medications) {
        const medMatch = medications.find(m =>
          m.name.toLowerCase().includes(med.name.toLowerCase()) ||
          med.name.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
        );
        const medName = medMatch ? medMatch.name : med.name;
        if (!prescriptions.some(p => p.medication.toLowerCase() === medName.toLowerCase())) {
          setPrescriptions(prev => [...prev, {
            medication: medName,
            dose: med.dose,
            route: med.route || 'Oral',
            frequency: med.frequency,
            duration: med.duration,
            instructions: '',
          }]);
        }
      }
    }

    // Lab Orders
    if (extraction.labOrders.length > 0) {
      setLabOrders(prev => {
        const updated = { ...prev };
        for (const lab of extraction.labOrders) {
          if (lab in updated) {
            updated[lab] = true;
          }
        }
        return updated;
      });
    }

    // Treatment Plan
    if (extraction.treatmentPlan.length > 0) {
      setTreatmentPlan(prev => {
        const existing = prev.trim();
        const newPlan = extraction.treatmentPlan.join('\n');
        return existing ? `${existing}\n${newPlan}` : newPlan;
      });
    }

    // Follow-up
    if (extraction.followUp) {
      setFollowUpReason(extraction.followUp);
    }

    // Referral
    if (extraction.referralNotes) {
      setAddReferral(true);
      setReferralReason(extraction.referralNotes);
    }

    // Open populated sections
    setOpenSections(prev => prev.map((v, i) => {
      if (i === 0 && extraction.chiefComplaint) return true;
      if (i === 1 && Object.values(extraction.vitals).some(val => val)) return true;
      if (i === 2 && extraction.examFindings.length > 0) return true;
      if (i === 4 && extraction.diagnoses.length > 0) return true;
      if (i === 5 && extraction.medications.length > 0) return true;
      if (i === 6 && extraction.labOrders.length > 0) return true;
      if (i === 7 && extraction.treatmentPlan.length > 0) return true;
      return v;
    }));

    setScribeOpen(false);
    showToast('Scribe data applied to consultation fields — review before saving.', 'success');
  };

  const acceptAIDiagnosis = (icd10Code: string, name: string, severity?: 'mild' | 'moderate' | 'severe') => {
    if (diagnoses.find(d => d.code === icd10Code)) return;
    addDiagnosis(icd10Code, name, severity);
    setAcceptedDiagnoses(prev => new Set(prev).add(icd10Code));
  };

  const acceptAITest = (testName: string) => {
    setLabOrders(prev => ({ ...prev, [testName]: true }));
    setAcceptedTests(prev => new Set(prev).add(testName));
  };

  const sectionHeaders: { icon: React.ElementType; label: string }[] = [
    { icon: ClipboardList, label: 'Chief Complaint' },      // 0
    { icon: Thermometer, label: 'Vital Signs' },             // 1
    { icon: Stethoscope, label: 'Physical Examination' },    // 2
    { icon: Brain, label: 'AI Clinical Evaluation' },        // 3
    { icon: AlertTriangle, label: 'Diagnosis' },             // 4
    { icon: Pill, label: 'Prescriptions' },                  // 5
    { icon: FlaskConical, label: 'Lab Orders' },             // 6
    { icon: FileText, label: 'Treatment Plan' },             // 7
    { icon: Paperclip, label: 'Attachments / Scans' },      // 8
    { icon: Calendar, label: 'Follow-up' },                  // 9
    { icon: Building2, label: 'Referral' },                  // 10
  ];

  const SectionHeader = ({ index }: { index: number }) => {
    const { icon: Icon, label } = sectionHeaders[index];
    return (
      <button
        onClick={() => toggleSection(index)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ borderBottom: openSections[index] ? '1px solid var(--border-light)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(43,111,224,0.10)' }}>
            <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        </div>
        {openSections[index] ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        )}
      </button>
    );
  };

  return (
    <>
      <TopBar title="New Consultation" />
      <main className="page-container page-enter">
          <button onClick={() => router.push('/patients')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--accent-primary)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">
              New Medical Consultation
            </h1>
            <button
              onClick={() => setScribeOpen(!scribeOpen)}
              className="btn btn-sm flex items-center gap-2"
              style={{
                background: scribeOpen ? 'rgba(229,46,66,0.12)' : 'rgba(43,111,224,0.10)',
                color: scribeOpen ? '#EF4444' : 'var(--accent-primary)',
                border: `1px solid ${scribeOpen ? 'rgba(229,46,66,0.2)' : 'rgba(43,111,224,0.2)'}`,
              }}
            >
              <Mic className="w-4 h-4" />
              {scribeOpen ? 'Close Scribe' : 'AI Scribe'}
            </button>
          </div>

          {/* Patient Selector */}
          <div className="card-elevated p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(43,111,224,0.10)' }}>
                <UserSearch className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select Patient</span>
            </div>

            {selectedPatientData ? (
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--taban-green)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: selectedPatientData.gender === 'Male' ? '#0077D7' : 'var(--accent-primary)' }}>
                    {(selectedPatientData.firstName || '?')[0]}{(selectedPatientData.surname || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedPatientData.firstName} {selectedPatientData.middleName} {selectedPatientData.surname}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {selectedPatientData.hospitalNumber} &middot; {selectedPatientData.gender} &middot; {selectedPatientData.state}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="btn btn-secondary btn-sm">
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="search"
                  placeholder="Search by patient name or hospital number..."
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="pl-9 search-icon-input"
                  style={{ background: 'var(--overlay-subtle)' }}
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {filteredPatients.map(p => {
                      const age = p.estimatedAge || (p.dateOfBirth ? (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : 0);
                      return (
                        <button
                          key={p._id}
                          onClick={() => { setSelectedPatient(p._id); setShowPatientDropdown(false); setPatientSearch(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                          style={{ borderBottom: '1px solid var(--border-light)' }}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: p.gender === 'Male' ? '#0077D7' : 'var(--accent-primary)' }}>
                            {(p.firstName || '?')[0]}{(p.surname || '?')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.firstName} {p.middleName} {p.surname}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.hospitalNumber} &middot; {age}y &middot; {p.gender} &middot; {p.tribe}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-6">
          {/* AI Clinical Scribe Panel */}
          {scribeOpen && (
            <div className="w-[380px] flex-shrink-0 sticky top-6 self-start rounded-2xl overflow-hidden" style={{
              height: 'calc(100vh - 180px)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}>
              <ClinicalScribe
                onApply={applyScribeExtraction}
                onClose={() => setScribeOpen(false)}
              />
            </div>
          )}

          {/* Left: Form sections */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Section 0: Chief Complaint */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={0} />
              {openSections[0] && (
                <div className="p-5">
                  <label>Chief Complaint / Presenting Symptoms</label>
                  <textarea
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    rows={3}
                    placeholder="Describe the patient's main complaint, duration, and associated symptoms..."
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            {/* Section 1: Vital Signs */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={1} />
              {openSections[1] && (
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label>Temperature (°C)</label>
                      <input type="number" step="0.1" value={vitals.temperature}
                        onChange={e => setVitals(v => ({ ...v, temperature: e.target.value }))}
                        placeholder="e.g. 37.0" />
                    </div>
                    <div>
                      <label>BP Systolic (mmHg)</label>
                      <input type="number" value={vitals.systolic}
                        onChange={e => setVitals(v => ({ ...v, systolic: e.target.value }))}
                        placeholder="e.g. 120" />
                    </div>
                    <div>
                      <label>BP Diastolic (mmHg)</label>
                      <input type="number" value={vitals.diastolic}
                        onChange={e => setVitals(v => ({ ...v, diastolic: e.target.value }))}
                        placeholder="e.g. 80" />
                    </div>
                    <div>
                      <label>Pulse Rate (bpm)</label>
                      <input type="number" value={vitals.pulse}
                        onChange={e => setVitals(v => ({ ...v, pulse: e.target.value }))}
                        placeholder="e.g. 72" />
                    </div>
                    <div>
                      <label>Respiratory Rate (/min)</label>
                      <input type="number" value={vitals.respRate}
                        onChange={e => setVitals(v => ({ ...v, respRate: e.target.value }))}
                        placeholder="e.g. 18" />
                    </div>
                    <div>
                      <label>O2 Saturation (%)</label>
                      <input type="number" value={vitals.o2Sat}
                        onChange={e => setVitals(v => ({ ...v, o2Sat: e.target.value }))}
                        placeholder="e.g. 98" />
                    </div>
                    <div>
                      <label>Weight (kg)</label>
                      <input type="number" step="0.1" value={vitals.weight}
                        onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))}
                        placeholder="e.g. 65.0" />
                    </div>
                    <div>
                      <label>Height (cm)</label>
                      <input type="number" step="0.1" value={vitals.height}
                        onChange={e => setVitals(v => ({ ...v, height: e.target.value }))}
                        placeholder="e.g. 170" />
                    </div>
                    <div>
                      <label>MUAC (cm)</label>
                      <input type="number" step="0.1" value={vitals.muac}
                        onChange={e => setVitals(v => ({ ...v, muac: e.target.value }))}
                        placeholder="e.g. 14.5" />
                    </div>
                  </div>
                  {vitals.weight && vitals.height && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Calculated BMI: </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {parseFloat(vitals.height) > 0 ? (parseFloat(vitals.weight) / ((parseFloat(vitals.height) / 100) ** 2)).toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Physical Examination */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={2} />
              {openSections[2] && (
                <div className="p-5 space-y-4">
                  {([
                    { key: 'general', label: 'General Appearance', placeholder: 'Alert, oriented, well/ill-appearing, nutritional status...' },
                    { key: 'cardiovascular', label: 'Cardiovascular', placeholder: 'Heart sounds, murmurs, peripheral pulses, edema...' },
                    { key: 'respiratory', label: 'Respiratory', placeholder: 'Chest expansion, breath sounds, adventitious sounds...' },
                    { key: 'abdominal', label: 'Abdominal', placeholder: 'Tenderness, distension, organomegaly, bowel sounds...' },
                    { key: 'neurological', label: 'Neurological', placeholder: 'Consciousness level, orientation, cranial nerves, reflexes...' },
                  ] as const).map(field => (
                    <div key={field.key}>
                      <label>{field.label}</label>
                      <textarea
                        value={physExam[field.key]}
                        onChange={e => setPhysExam(prev => ({ ...prev, [field.key]: e.target.value }))}
                        rows={2}
                        placeholder={field.placeholder}
                        className="resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: AI Clinical Evaluation */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={3} />
              {openSections[3] && (
                <div className="p-5">
                  {/* Analyze Button */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={runAIEvaluation}
                      disabled={aiLoading || !chiefComplaint}
                      className="btn btn-primary btn-sm"
                      style={{ background: !chiefComplaint ? 'var(--text-muted)' : 'var(--accent-primary)', border: 'none' }}
                    >
                      {aiLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Analyze Patient Data
                        </span>
                      )}
                    </button>
                    {!chiefComplaint && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter a chief complaint first</span>
                    )}
                  </div>

                  {aiEvaluation && (
                    <div className="space-y-4">
                      {/* Severity Assessment */}
                      <div className="p-3 rounded-lg" style={{
                        background: aiEvaluation.severityAssessment.includes('HIGH') ? 'rgba(229,46,66,0.12)' : aiEvaluation.severityAssessment.includes('MODERATE') ? 'rgba(252,211,77,0.12)' : 'rgba(43,111,224,0.12)',
                        border: `1px solid ${aiEvaluation.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : aiEvaluation.severityAssessment.includes('MODERATE') ? '#FCD34D' : 'var(--taban-green)'}`,
                      }}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className="w-4 h-4" style={{ color: aiEvaluation.severityAssessment.includes('HIGH') ? 'var(--taban-red)' : aiEvaluation.severityAssessment.includes('MODERATE') ? '#FCD34D' : 'var(--taban-green)' }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: aiEvaluation.severityAssessment.includes('HIGH') ? '#F87171' : aiEvaluation.severityAssessment.includes('MODERATE') ? '#FCD34D' : 'var(--taban-green)' }}>
                            Severity Assessment
                          </span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{aiEvaluation.severityAssessment}</p>
                      </div>

                      {/* Vital Sign Alerts */}
                      {aiEvaluation.vitalSignAlerts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4" style={{ color: '#F59E0B' }} />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Vital Sign Alerts</span>
                          </div>
                          <div className="space-y-1.5">
                            {aiEvaluation.vitalSignAlerts.map((alert, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                                <span style={{ color: 'var(--text-primary)' }}>{alert}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Diagnoses */}
                      {aiEvaluation.suggestedDiagnoses.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Suggested Diagnoses</span>
                          </div>
                          <div className="space-y-2">
                            {aiEvaluation.suggestedDiagnoses.map((dx) => {
                              const isAccepted = acceptedDiagnoses.has(dx.icd10Code) || diagnoses.some(d => d.code === dx.icd10Code);
                              return (
                                <div key={dx.icd10Code} className="p-3 rounded-lg" style={{
                                  background: isAccepted ? 'rgba(43,111,224,0.08)' : 'var(--overlay-subtle)',
                                  border: `1px solid ${isAccepted ? 'var(--taban-green)' : 'var(--border-light)'}`,
                                }}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(43,111,224,0.10)', color: 'var(--accent-primary)' }}>{dx.icd10Code}</span>
                                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{dx.name}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${dx.severity === 'severe' ? 'badge-emergency' : dx.severity === 'moderate' ? 'badge-warning' : 'badge-normal'}`}>
                                        {dx.severity}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
                                          <div className="h-full rounded-full" style={{
                                            width: `${dx.confidence}%`,
                                            background: dx.confidence >= 70 ? '#0077D7' : dx.confidence >= 40 ? '#F59E0B' : 'var(--text-muted)',
                                          }} />
                                        </div>
                                        <span className="text-xs font-bold" style={{ color: dx.confidence >= 70 ? '#0077D7' : dx.confidence >= 40 ? '#F59E0B' : 'var(--text-muted)' }}>
                                          {dx.confidence}%
                                        </span>
                                      </div>
                                      {isAccepted ? (
                                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: 'var(--accent-light)', color: 'var(--taban-green)' }}>
                                          <Check className="w-3 h-3" /> Added
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => acceptAIDiagnosis(dx.icd10Code, dx.name, dx.severity)}
                                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors"
                                          style={{ background: 'rgba(43,111,224,0.10)', color: 'var(--accent-primary)' }}
                                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,111,224,0.20)'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43,111,224,0.10)'; }}
                                        >
                                          <Plus className="w-3 h-3" /> Add
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{dx.reasoning}</p>
                                  {dx.suggestedTreatment && (
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      <span className="font-semibold">Tx:</span> {dx.suggestedTreatment}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recommended Tests */}
                      {aiEvaluation.recommendedTests.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TestTubes className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recommended Tests</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aiEvaluation.recommendedTests.map(test => {
                              const isAccepted = acceptedTests.has(test) || labOrders[test];
                              return (
                                <button
                                  key={test}
                                  onClick={() => acceptAITest(test)}
                                  disabled={isAccepted}
                                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                                  style={{
                                    background: isAccepted ? 'rgba(43,111,224,0.12)' : 'rgba(43,111,224,0.08)',
                                    border: `1px solid ${isAccepted ? 'var(--taban-green)' : 'var(--accent-primary)'}`,
                                    color: isAccepted ? 'var(--taban-green)' : 'var(--accent-primary)',
                                    cursor: isAccepted ? 'default' : 'pointer',
                                  }}
                                >
                                  {isAccepted ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                  {test}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Clinical Notes */}
                      <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>AI Reasoning Summary</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aiEvaluation.clinicalNotes}</p>
                        <p className="text-[10px] mt-2 italic" style={{ color: 'var(--text-muted)' }}>
                          Evaluated at {new Date(aiEvaluation.evaluatedAt).toLocaleTimeString()} — WHO/IMCI guideline-based analysis
                        </p>
                      </div>
                    </div>
                  )}

                  {!aiEvaluation && !aiLoading && (
                    <div className="text-center py-4">
                      <Brain className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Enter patient data above, then click &quot;Analyze&quot; for AI-assisted clinical evaluation.
                        <br />Runs locally — no internet required.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Diagnosis */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={4} />
              {openSections[4] && (
                <div className="p-5">
                  {/* ICD-10 Search */}
                  <div className="relative mb-4">
                    <label>Search ICD-10 Code or Diagnosis</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="search"
                        placeholder="Search by code (e.g. B50) or name (e.g. Malaria)..."
                        value={diagSearch}
                        onChange={e => { setDiagSearch(e.target.value); setShowDiagDropdown(true); }}
                        onFocus={() => setShowDiagDropdown(true)}
                        className="pl-9 search-icon-input"
                        style={{ background: 'var(--overlay-subtle)' }}
                      />
                    </div>
                    {showDiagDropdown && filteredICD.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                        {filteredICD.map(c => (
                          <button
                            key={c.code}
                            onClick={() => addDiagnosis(c.code, c.name)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                            style={{ borderBottom: '1px solid var(--border-light)' }}
                          >
                            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(43,111,224,0.10)', color: 'var(--accent-primary)' }}>{c.code}</span>
                            <span className="text-sm">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Added Diagnoses */}
                  {diagnoses.length > 0 ? (
                    <div className="space-y-2">
                      {diagnoses.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                          <span className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(43,111,224,0.10)', color: 'var(--accent-primary)' }}>{d.code}</span>
                          <span className="text-sm font-medium flex-1 min-w-0 truncate">{d.name}</span>
                          <select
                            value={d.type}
                            onChange={e => updateDiagnosis(i, 'type', e.target.value)}
                            className="text-xs"
                            style={{ width: '120px', padding: '6px 30px 6px 10px', fontSize: '0.75rem' }}
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </select>
                          <select
                            value={d.certainty}
                            onChange={e => updateDiagnosis(i, 'certainty', e.target.value)}
                            className="text-xs"
                            style={{ width: '120px', padding: '6px 30px 6px 10px', fontSize: '0.75rem' }}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="suspected">Suspected</option>
                          </select>
                          <select
                            value={d.severity}
                            onChange={e => updateDiagnosis(i, 'severity', e.target.value)}
                            className="text-xs"
                            style={{ width: '110px', padding: '6px 30px 6px 10px', fontSize: '0.75rem' }}
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                          <button onClick={() => removeDiagnosis(i)} className="p-1 rounded transition-colors flex-shrink-0" style={{ background: 'transparent' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,46,66,0.15)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <X className="w-4 h-4" style={{ color: 'var(--taban-red)' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>No diagnoses added yet. Search above to add ICD-10 codes.</p>
                  )}
                </div>
              )}
            </div>

            {/* Section 5: Prescriptions */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={5} />
              {openSections[5] && (
                <div className="p-5">
                  {/* Medication Search */}
                  <div className="relative mb-4">
                    <label>Search Medication</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="search"
                        placeholder="Search by medication name or category..."
                        value={rxMedSearch}
                        onChange={e => { setRxMedSearch(e.target.value); setShowRxDropdown(true); }}
                        onFocus={() => setShowRxDropdown(true)}
                        className="pl-9 search-icon-input"
                        style={{ background: 'var(--overlay-subtle)' }}
                      />
                    </div>
                    {showRxDropdown && filteredMeds.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                        {filteredMeds.map(m => (
                          <button
                            key={m.name}
                            onClick={() => addPrescription(m.name)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                            style={{ borderBottom: '1px solid var(--border-light)' }}
                          >
                            <span className="text-sm font-medium">{m.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(252,211,77,0.10)', color: '#FCD34D' }}>{m.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Added Prescriptions */}
                  {prescriptions.length > 0 ? (
                    <div className="space-y-3">
                      {prescriptions.map((rx, i) => (
                        <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                              <span className="text-sm font-semibold">{rx.medication}</span>
                            </div>
                            <button onClick={() => removePrescription(i)} className="p-1 rounded transition-colors" style={{ background: 'transparent' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,46,66,0.15)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <X className="w-4 h-4" style={{ color: 'var(--taban-red)' }} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label>Dose</label>
                              <input type="text" value={rx.dose}
                                onChange={e => updatePrescription(i, 'dose', e.target.value)}
                                placeholder="e.g. 500mg" />
                            </div>
                            <div>
                              <label>Route</label>
                              <select value={rx.route} onChange={e => updatePrescription(i, 'route', e.target.value)}>
                                {routeOptions.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Frequency</label>
                              <select value={rx.frequency} onChange={e => updatePrescription(i, 'frequency', e.target.value)}>
                                <option value="">Select frequency</option>
                                {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Duration</label>
                              <input type="text" value={rx.duration}
                                onChange={e => updatePrescription(i, 'duration', e.target.value)}
                                placeholder="e.g. 7 days" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label>Instructions</label>
                            <input type="text" value={rx.instructions}
                              onChange={e => updatePrescription(i, 'instructions', e.target.value)}
                              placeholder="e.g. Take with food, complete full course..." />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>No prescriptions added yet. Search above to add medications.</p>
                  )}
                </div>
              )}
            </div>

            {/* Section 6: Lab Orders */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={6} />
              {openSections[6] && (
                <div className="p-5">
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Select tests to order for this patient.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {labTests.map(test => (
                      <label
                        key={test}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                        style={{
                          background: labOrders[test] ? 'rgba(43,111,224,0.10)' : 'var(--overlay-subtle)',
                          border: `1px solid ${labOrders[test] ? '#0077D7' : 'var(--border-light)'}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={labOrders[test]}
                          onChange={e => setLabOrders(prev => ({ ...prev, [test]: e.target.checked }))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-3.5 h-3.5" style={{ color: labOrders[test] ? '#0077D7' : 'var(--text-muted)' }} />
                          <span className="text-sm font-medium" style={{ color: labOrders[test] ? '#0077D7' : 'var(--text-primary)' }}>{test}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {Object.values(labOrders).some(v => v) && (
                    <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--taban-green)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--taban-green)' }}>
                        {Object.values(labOrders).filter(v => v).length} test(s) selected for ordering.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 7: Treatment Plan */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={7} />
              {openSections[7] && (
                <div className="p-5">
                  <label>Treatment Plan / Clinical Notes</label>
                  <textarea
                    value={treatmentPlan}
                    onChange={e => setTreatmentPlan(e.target.value)}
                    rows={4}
                    placeholder="Describe the treatment plan, patient education, lifestyle recommendations, warning signs to watch for..."
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            {/* Section 8: Attachments / Scans */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={8} />
              {openSections[8] && (
                <div className="p-5">
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Upload scans, X-rays, lab reports, or other documents for this consultation.
                  </p>
                  <FileUpload
                    attachments={consultAttachments}
                    onAdd={(att) => setConsultAttachments(prev => [...prev, att])}
                    onRemove={(id) => setConsultAttachments(prev => prev.filter(a => a.id !== id))}
                    uploaderName={currentUser?.name || 'Unknown'}
                    maxFiles={10}
                  />
                </div>
              )}
            </div>

            {/* Section 9: Follow-up */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={9} />
              {openSections[9] && (
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Follow-up Date</label>
                      <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                    </div>
                    <div>
                      <label>Reason for Follow-up</label>
                      <input type="text" value={followUpReason} onChange={e => setFollowUpReason(e.target.value)}
                        placeholder="e.g. Review lab results, medication check..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 10: Referral */}
            <div className="card-elevated overflow-hidden">
              <SectionHeader index={10} />
              {openSections[10] && (
                <div className="p-5">
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addReferral}
                      onChange={e => setAddReferral(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add referral to another facility</span>
                  </label>

                  {addReferral && (
                    <div className="space-y-4 p-4 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label>Referral Hospital</label>
                          <select value={referralHospital} onChange={e => setReferralHospital(e.target.value)}>
                            <option value="">Select hospital</option>
                            {hospitals.map(h => (
                              <option key={h._id} value={h._id}>{h.name} ({h.state})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label>Urgency</label>
                          <select value={referralUrgency} onChange={e => setReferralUrgency(e.target.value)}>
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label>Reason for Referral</label>
                        <textarea
                          value={referralReason}
                          onChange={e => setReferralReason(e.target.value)}
                          rows={2}
                          placeholder="Describe the reason for referral, what services are needed..."
                          className="resize-none"
                        />
                      </div>
                      {referralUrgency === 'emergency' && (
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(229,46,66,0.12)', border: '1px solid var(--taban-red)' }}>
                          <p className="text-xs font-medium" style={{ color: '#F87171' }}>
                            Emergency referral: Ensure patient transport and receiving facility notification are arranged immediately.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 pb-8">
              <button onClick={() => router.push('/patients')} className="btn btn-secondary">
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary btn-lg">
                <Save className="w-4 h-4" /> Save Consultation
              </button>
            </div>
          </div>

          {/* Right: Patient summary panel */}
          <div className="hidden xl:block w-[320px] flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {selectedPatientData ? (
                <>
                  {/* Patient card */}
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: selectedPatientData.gender === 'Male' ? '#0077D7' : 'var(--accent-primary)' }}>
                        {(selectedPatientData.firstName || '?')[0]}{(selectedPatientData.surname || '?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {selectedPatientData.firstName} {selectedPatientData.surname}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {selectedPatientData.hospitalNumber}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Gender', value: selectedPatientData.gender },
                        { label: 'Age', value: selectedPatientData.estimatedAge ? `~${selectedPatientData.estimatedAge}y` : selectedPatientData.dateOfBirth ? `${new Date().getFullYear() - new Date(selectedPatientData.dateOfBirth).getFullYear()}y` : 'Unknown' },
                        { label: 'Blood Type', value: selectedPatientData.bloodType || 'Unknown' },
                        { label: 'State', value: selectedPatientData.state },
                        { label: 'Tribe', value: selectedPatientData.tribe },
                        { label: 'Phone', value: selectedPatientData.phone || 'N/A' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between text-xs py-1" style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  {selectedPatientData.allergies && selectedPatientData.allergies.length > 0 && (
                    <div className="card-elevated p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" style={{ color: 'var(--taban-red)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--taban-red)' }}>Allergies</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPatientData.allergies.map((a: string) => (
                          <span key={a} className="text-xs px-2 py-1 rounded-full font-medium" style={{
                            background: 'rgba(229,46,66,0.12)',
                            color: '#F87171',
                            border: '1px solid rgba(229,46,66,0.2)',
                          }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronic conditions */}
                  {selectedPatientData.chronicConditions && selectedPatientData.chronicConditions.length > 0 && (
                    <div className="card-elevated p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="w-4 h-4" style={{ color: 'var(--ss-yellow)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ss-yellow)' }}>Chronic Conditions</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPatientData.chronicConditions.map((c: string) => (
                          <span key={c} className="text-xs px-2 py-1 rounded-full font-medium" style={{
                            background: 'rgba(252,211,77,0.12)',
                            color: '#FCD34D',
                            border: '1px solid rgba(252,211,77,0.2)',
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultation progress */}
                  <div className="card-elevated p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Consultation Progress</p>
                    <div className="space-y-2">
                      {sectionHeaders.map((s, i) => {
                        const Icon = s.icon;
                        const filled = i === 0 ? chiefComplaint.length > 0
                          : i === 1 ? Object.values(vitals).some(v => v !== '')
                          : i === 2 ? Object.values(physExam).some(v => v !== '')
                          : i === 3 ? aiEvaluation !== null
                          : i === 4 ? diagnoses.length > 0
                          : i === 5 ? prescriptions.length > 0
                          : i === 6 ? Object.values(labOrders).some(v => v)
                          : i === 7 ? treatmentPlan.length > 0
                          : i === 8 ? consultAttachments.length > 0
                          : i === 9 ? followUpDate !== ''
                          : addReferral;
                        return (
                          <div key={s.label} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                              background: filled ? 'rgba(43,111,224,0.15)' : 'var(--overlay-subtle)',
                              border: `1px solid ${filled ? 'var(--taban-green)' : 'var(--border-light)'}`,
                            }}>
                              {filled ? (
                                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="#0077D7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <Icon className="w-2.5 h-2.5" style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <span className="text-xs" style={{ color: filled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="card-elevated p-6 text-center">
                  <UserSearch className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No patient selected</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Search and select a patient to begin the consultation.</p>
                </div>
              )}
            </div>
          </div>
          </div>
      </main>
    </>
  );
}
