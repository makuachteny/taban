'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { Check, Camera, ArrowLeft, ArrowRight } from 'lucide-react';
import { statesAndCounties, states, tribes, languages, bloodTypes } from '@/data/mock';
import { usePatients } from '@/lib/hooks/usePatients';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';

const steps = ['Demographics', 'Contact & Location', 'Next of Kin', 'Medical Info', 'Review'];

export default function NewPatientPage() {
  const router = useRouter();
  const { create: createPatient } = usePatients();
  const { currentUser } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '', middleName: '', surname: '', maidenName: '',
    dateOfBirth: '', estimatedAge: '', gender: '', tribe: '', primaryLanguage: '',
    phone: '', altPhone: '', whatsapp: '',
    state: '', county: '', payam: '', boma: '', bomaCode: '', householdNumber: '', address: '',
    nationalId: '',
    nokName: '', nokRelationship: '', nokPhone: '', nokAddress: '',
    bloodType: 'Unknown', allergies: '' as string, chronicConditions: '' as string,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };
  const counties = form.state ? statesAndCounties[form.state] || [] : [];

  const geocodeId = form.bomaCode && form.householdNumber
    ? `BOMA-${form.bomaCode.toUpperCase()}-HH${form.householdNumber}`
    : undefined;

  // Validate current step before allowing navigation
  const validateStep = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = 'First name is required';
      if (!form.surname.trim()) errs.surname = 'Surname is required';
      if (!form.gender) errs.gender = 'Gender is required';
      if (!form.dateOfBirth && !form.estimatedAge) errs.dateOfBirth = 'Date of birth or estimated age is required';
    } else if (s === 1) {
      if (!form.state) errs.state = 'State is required';
    }
    return errs;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    // Validate all steps before submitting
    const allErrors = { ...validateStep(0), ...validateStep(1) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await createPatient({
        hospitalNumber: '',
        geocodeId,
        householdNumber: form.householdNumber ? parseInt(form.householdNumber) : undefined,
        nationalId: form.nationalId || undefined,
        bomaCode: form.bomaCode || undefined,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        surname: form.surname.trim(),
        maidenName: form.maidenName.trim(),
        dateOfBirth: form.dateOfBirth,
        estimatedAge: form.estimatedAge ? parseInt(form.estimatedAge) : undefined,
        gender: form.gender as 'Male' | 'Female',
        tribe: form.tribe,
        primaryLanguage: form.primaryLanguage,
        phone: form.phone,
        altPhone: form.altPhone,
        whatsapp: form.whatsapp,
        state: form.state,
        county: form.county,
        payam: form.payam,
        boma: form.boma,
        address: form.address,
        nokName: form.nokName,
        nokRelationship: form.nokRelationship,
        nokPhone: form.nokPhone,
        nokAddress: form.nokAddress,
        bloodType: form.bloodType,
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()) : ['None known'],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(c => c.trim()) : ['None'],
        registrationHospital: currentUser?.hospitalId || '',
        registrationDate: today,
        lastVisitDate: today,
        lastVisitHospital: currentUser?.hospitalId || '',
        isActive: true,
      });
      showToast(`Patient ${form.firstName} ${form.surname} registered successfully!`, 'success');
      router.push('/patients');
    } catch (err) {
      console.error('Failed to register patient:', err);
      if (err instanceof Error && 'fields' in err) {
        const validationErr = err as Error & { fields: Record<string, string> };
        setErrors(validationErr.fields);
        showToast('Validation failed: ' + Object.values(validationErr.fields).join(', '), 'error');
      } else {
        showToast('Failed to register patient. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Register New Patient" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">
          <button onClick={() => router.push('/patients')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--taban-blue)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </button>

          <h1 className="text-xl font-semibold mb-6">
            Patient Registration
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`step-dot ${i === step ? 'step-dot-active' : i < step ? 'step-dot-completed' : ''}`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] mt-1.5 font-medium whitespace-nowrap" style={{ color: i === step ? 'var(--taban-blue)' : 'var(--text-muted)' }}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`step-line mx-2 ${i < step ? 'step-line-completed' : i === step ? 'step-line-active' : ''}`} />
                )}
              </div>
            ))}
          </div>

          <div className="card-elevated p-6 max-w-4xl">
            {/* Step 0: Demographics */}
            {step === 0 && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold mb-4">Patient Demographics</h3>
                <div className="flex gap-3 items-start">
                  <div className="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-[var(--taban-blue)] transition-colors" style={{ borderColor: 'var(--border-medium)', background: 'var(--overlay-subtle)' }}>
                    <Camera className="w-6 h-6 mb-1" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Add Photo</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label>First Name *</label>
                      <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="e.g. Deng" style={errors.firstName ? { borderColor: '#EF4444' } : {}} />
                      {errors.firstName && <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{errors.firstName}</p>}
                    </div>
                    <div>
                      <label>Middle Name</label>
                      <input type="text" value={form.middleName} onChange={e => update('middleName', e.target.value)} placeholder="e.g. Mabior" />
                    </div>
                    <div>
                      <label>Surname *</label>
                      <input type="text" value={form.surname} onChange={e => update('surname', e.target.value)} placeholder="e.g. Garang" style={errors.surname ? { borderColor: '#EF4444' } : {}} />
                      {errors.surname && <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{errors.surname}</p>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label>Maiden Name</label>
                    <input type="text" value={form.maidenName} onChange={e => update('maidenName', e.target.value)} placeholder="For married women" />
                  </div>
                  <div>
                    <label>Date of Birth {!form.estimatedAge && '*'}</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} style={errors.dateOfBirth ? { borderColor: '#EF4444' } : {}} />
                    {errors.dateOfBirth && <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label>Estimated Age (if DOB unknown)</label>
                    <input type="number" value={form.estimatedAge} onChange={e => update('estimatedAge', e.target.value)} placeholder="e.g. 35" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label>Gender *</label>
                    <select value={form.gender} onChange={e => update('gender', e.target.value)} style={errors.gender ? { borderColor: '#EF4444' } : {}}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{errors.gender}</p>}
                  </div>
                  <div>
                    <label>Tribe / Ethnicity</label>
                    <select value={form.tribe} onChange={e => update('tribe', e.target.value)}>
                      <option value="">Select tribe</option>
                      {tribes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Primary Language</label>
                    <select value={form.primaryLanguage} onChange={e => update('primaryLanguage', e.target.value)}>
                      <option value="">Select language</option>
                      {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Contact & Location */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold mb-4">Contact & Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label>Phone Number *</label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="e.g. 0912345678" />
                  </div>
                  <div>
                    <label>Alternative Phone</label>
                    <input type="tel" value={form.altPhone} onChange={e => update('altPhone', e.target.value)} placeholder="Optional" />
                  </div>
                  <div>
                    <label>WhatsApp Number</label>
                    <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="If different" />
                  </div>
                </div>

                {/* Geocode Identification */}
                <div className="border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
                  <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Geographic Identifier</h4>
                  <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                    Geocode ID replaces national ID for patient tracking. Format: BOMA-XX-HH1001
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label>Boma Code</label>
                      <input type="text" value={form.bomaCode} onChange={e => update('bomaCode', e.target.value.toUpperCase().slice(0, 4))} placeholder="e.g. XY" maxLength={4} />
                    </div>
                    <div>
                      <label>Household Number</label>
                      <input type="number" value={form.householdNumber} onChange={e => update('householdNumber', e.target.value)} placeholder="e.g. 1001" />
                    </div>
                    <div>
                      <label>Geocode ID</label>
                      <input type="text" readOnly value={geocodeId || '—'} className="font-mono" style={{ background: 'var(--overlay-subtle)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label>National ID (if available)</label>
                      <input type="text" value={form.nationalId} onChange={e => update('nationalId', e.target.value)} placeholder="Optional — most won't have" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label>State *</label>
                      <select value={form.state} onChange={e => { update('state', e.target.value); update('county', ''); }} style={errors.state ? { borderColor: '#EF4444' } : {}}>
                        <option value="">Select state</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{errors.state}</p>}
                    </div>
                    <div>
                      <label>County *</label>
                      <select value={form.county} onChange={e => update('county', e.target.value)} disabled={!form.state}>
                        <option value="">Select county</option>
                        {counties.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Payam (Sub-county)</label>
                      <input type="text" value={form.payam} onChange={e => update('payam', e.target.value)} placeholder="Enter payam" />
                    </div>
                    <div>
                      <label>Boma (Village)</label>
                      <input type="text" value={form.boma} onChange={e => update('boma', e.target.value)} placeholder="Enter boma" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label>Residential Address</label>
                    <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2} placeholder="Detailed address description" className="resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Next of Kin */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold mb-4">Next of Kin</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label>Full Name *</label>
                    <input type="text" value={form.nokName} onChange={e => update('nokName', e.target.value)} placeholder="Next of kin full name" />
                  </div>
                  <div>
                    <label>Relationship *</label>
                    <select value={form.nokRelationship} onChange={e => update('nokRelationship', e.target.value)}>
                      <option value="">Select relationship</option>
                      {['Spouse', 'Parent', 'Child', 'Sibling', 'Uncle', 'Aunt', 'Cousin', 'Friend', 'Other'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Phone Number *</label>
                    <input type="tel" value={form.nokPhone} onChange={e => update('nokPhone', e.target.value)} placeholder="e.g. 0912345678" />
                  </div>
                  <div>
                    <label>Address</label>
                    <input type="text" value={form.nokAddress} onChange={e => update('nokAddress', e.target.value)} placeholder="Address of next of kin" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical Info */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold mb-4">Medical Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label>Blood Type</label>
                    <select value={form.bloodType} onChange={e => update('bloodType', e.target.value)}>
                      {bloodTypes.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label>Known Allergies</label>
                  <textarea value={form.allergies} onChange={e => update('allergies', e.target.value)} rows={2} placeholder="List known allergies (e.g. Penicillin, Sulfa drugs). Write 'None known' if no known allergies." className="resize-none" />
                </div>
                <div>
                  <label>Chronic Conditions</label>
                  <textarea value={form.chronicConditions} onChange={e => update('chronicConditions', e.target.value)} rows={2} placeholder="List chronic conditions (e.g. HIV, Hypertension, Diabetes). Write 'None' if none." className="resize-none" />
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(252,211,77,0.10)', border: '1px solid rgba(252,211,77,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: '#FCD34D' }}>
                    Important: Allergy and chronic condition information is critical for patient safety. Please verify with the patient before proceeding.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold mb-4">Review & Confirm</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Demographics</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Name:</span> {form.firstName} {form.middleName} {form.surname}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>DOB:</span> {form.dateOfBirth || `~${form.estimatedAge} years`}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Gender:</span> {form.gender}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Tribe:</span> {form.tribe}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Contact & Identity</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {form.phone}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Location:</span> {form.state}, {form.county}</p>
                      {geocodeId && <p className="text-sm font-mono"><span style={{ color: 'var(--text-muted)' }}>Geocode ID:</span> {geocodeId}</p>}
                      {form.nationalId && <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>National ID:</span> {form.nationalId}</p>}
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>NOK:</span> {form.nokName} ({form.nokRelationship})</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Medical</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Blood Type:</span> {form.bloodType}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Allergies:</span> {form.allergies || 'None specified'}</p>
                      <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Conditions:</span> {form.chronicConditions || 'None specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-5 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/patients')} className="btn btn-secondary">
                <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Previous'}
              </button>
              {step < steps.length - 1 ? (
                <button onClick={goNext} className="btn btn-primary">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-success" style={{ opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</> : <><Check className="w-4 h-4" /> Register Patient</>}
                </button>
              )}
            </div>
          </div>
      </main>
    </>
  );
}
