'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/context';
import TopBar from '@/components/TopBar';
import { useHospitals } from '@/lib/hooks/useHospitals';
import {
  Building2, BedDouble, Users, Zap,
  Activity, Save, CheckCircle, AlertTriangle, Loader2,
} from 'lucide-react';

export default function MyFacilityPage() {
  const { currentUser } = useApp();
  const { hospitals, loading: hospitalsLoading, update } = useHospitals();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [operationalStatus, setOperationalStatus] = useState<string>('functional');
  const [totalBeds, setTotalBeds] = useState(0);
  const [icuBeds, setIcuBeds] = useState(0);
  const [maternityBeds, setMaternityBeds] = useState(0);
  const [pediatricBeds, setPediatricBeds] = useState(0);
  const [doctors, setDoctors] = useState(0);
  const [nurses, setNurses] = useState(0);
  const [clinicalOfficers, setClinicalOfficers] = useState(0);
  const [labTechnicians, setLabTechnicians] = useState(0);
  const [pharmacists, setPharmacists] = useState(0);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [electricityHours, setElectricityHours] = useState(0);
  const [hasGenerator, setHasGenerator] = useState(false);
  const [hasSolar, setHasSolar] = useState(false);
  const [hasInternet, setHasInternet] = useState(false);
  const [internetType, setInternetType] = useState('');
  const [hasAmbulance, setHasAmbulance] = useState(false);
  const [emergency24hr, setEmergency24hr] = useState(false);
  const [serviceFlags, setServiceFlags] = useState({
    epi: false, anc: false, delivery: false, hiv: false,
    tb: false, emergencySurgery: false, laboratory: false, pharmacy: false,
  });

  const hospitalId = currentUser?.hospitalId;
  const hospital = hospitals.find(h => h._id === hospitalId);

  // Populate form when hospital loads
  useEffect(() => {
    if (!hospital) return;
    setOperationalStatus(hospital.operationalStatus || 'functional');
    setTotalBeds(hospital.totalBeds || 0);
    setIcuBeds(hospital.icuBeds || 0);
    setMaternityBeds(hospital.maternityBeds || 0);
    setPediatricBeds(hospital.pediatricBeds || 0);
    setDoctors(hospital.doctors || 0);
    setNurses(hospital.nurses || 0);
    setClinicalOfficers(hospital.clinicalOfficers || 0);
    setLabTechnicians(hospital.labTechnicians || 0);
    setPharmacists(hospital.pharmacists || 0);
    setHasElectricity(hospital.hasElectricity || false);
    setElectricityHours(hospital.electricityHours || 0);
    setHasGenerator(hospital.hasGenerator || false);
    setHasSolar(hospital.hasSolar || false);
    setHasInternet(hospital.hasInternet || false);
    setInternetType(hospital.internetType || '');
    setHasAmbulance(hospital.hasAmbulance || false);
    setEmergency24hr(hospital.emergency24hr || false);
    setServiceFlags(hospital.serviceFlags || {
      epi: false, anc: false, delivery: false, hiv: false,
      tb: false, emergencySurgery: false, laboratory: false, pharmacy: false,
    });
  }, [hospital]);

  const handleSave = useCallback(async () => {
    if (!hospitalId) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await update(hospitalId, {
        operationalStatus: operationalStatus as 'functional' | 'partially_functional' | 'non_functional' | 'closed',
        totalBeds, icuBeds, maternityBeds, pediatricBeds,
        doctors, nurses, clinicalOfficers, labTechnicians, pharmacists,
        hasElectricity, electricityHours, hasGenerator, hasSolar,
        hasInternet, internetType, hasAmbulance, emergency24hr,
        serviceFlags,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [hospitalId, update, operationalStatus, totalBeds, icuBeds, maternityBeds, pediatricBeds, doctors, nurses, clinicalOfficers, labTechnicians, pharmacists, hasElectricity, electricityHours, hasGenerator, hasSolar, hasInternet, internetType, hasAmbulance, emergency24hr, serviceFlags]);

  const toggleService = (key: keyof typeof serviceFlags) => {
    setServiceFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Not assigned to a facility
  if (!hospitalId) {
    return (
      <>
        <TopBar title="My Facility" />
        <main className="page-container page-enter">
          <div className="card-elevated p-8 text-center max-w-md mx-auto mt-16">
            <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Not Assigned to a Facility</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your account is not currently linked to a hospital facility. Contact your administrator to be assigned.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (hospitalsLoading) {
    return (
      <>
        <TopBar title="My Facility" />
        <main className="page-container page-enter flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </main>
      </>
    );
  }

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    functional: { bg: 'rgba(74,222,128,0.12)', color: '#4ADE80', label: 'Functional' },
    partially_functional: { bg: 'rgba(252,211,77,0.12)', color: '#FCD34D', label: 'Partially Functional' },
    non_functional: { bg: 'rgba(229,46,66,0.12)', color: '#E52E42', label: 'Non-Functional' },
    closed: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', label: 'Closed' },
  };

  const sectionClass = 'card-elevated p-5 space-y-4';
  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 pb-3 mb-1" style={{ borderBottom: '1px solid var(--border-light)' }}>
      {icon}
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    </div>
  );

  const numberInput = (label: string, value: number, onChange: (v: number) => void, max?: number) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full px-3 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );

  const toggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5.5 rounded-full transition-colors duration-200"
        style={{
          background: checked ? '#0077D7' : 'var(--border-light)',
          width: '40px',
          height: '22px',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-transform duration-200 bg-white"
          style={{
            width: '18px',
            height: '18px',
            transform: checked ? 'translateX(20px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );

  return (
    <>
      <TopBar title="My Facility" />
      <main className="page-container page-enter">

        {/* Header Card */}
        <div className="card-elevated p-5 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,119,215,0.12)' }}>
                <Building2 className="w-6 h-6" style={{ color: '#0077D7' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{hospital?.name || 'Unknown Facility'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{hospital?.state}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                    background: 'rgba(0,119,215,0.08)',
                    color: '#0077D7',
                  }}>
                    {hospital?.facilityType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#E52E42' }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </span>
              )}
              {saved && (
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#4ADE80' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Saved successfully
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all"
                style={{
                  background: saving ? '#94A3B8' : 'linear-gradient(135deg, #0077D7, #005FBC)',
                  boxShadow: '0 2px 8px rgba(0,119,215,0.3)',
                }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Operational Status */}
          <div className={sectionClass}>
            {sectionTitle(<Activity className="w-4 h-4" style={{ color: '#0077D7' }} />, 'Operational Status')}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Status</label>
              <select
                value={operationalStatus}
                onChange={e => setOperationalStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="functional">Functional</option>
                <option value="partially_functional">Partially Functional</option>
                <option value="non_functional">Non-Functional</option>
                <option value="closed">Closed</option>
              </select>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{
                  background: statusColors[operationalStatus]?.bg,
                  color: statusColors[operationalStatus]?.color,
                }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[operationalStatus]?.color }} />
                  {statusColors[operationalStatus]?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bed Capacity */}
          <div className={sectionClass}>
            {sectionTitle(<BedDouble className="w-4 h-4" style={{ color: '#FCD34D' }} />, 'Bed Capacity')}
            <div className="grid grid-cols-2 gap-3">
              {numberInput('Total Beds', totalBeds, setTotalBeds)}
              {numberInput('ICU Beds', icuBeds, setIcuBeds)}
              {numberInput('Maternity Beds', maternityBeds, setMaternityBeds)}
              {numberInput('Pediatric Beds', pediatricBeds, setPediatricBeds)}
            </div>
          </div>

          {/* Staffing */}
          <div className={sectionClass}>
            {sectionTitle(<Users className="w-4 h-4" style={{ color: '#60A5FA' }} />, 'Staffing')}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {numberInput('Doctors', doctors, setDoctors)}
              {numberInput('Nurses', nurses, setNurses)}
              {numberInput('Clinical Officers', clinicalOfficers, setClinicalOfficers)}
              {numberInput('Lab Technicians', labTechnicians, setLabTechnicians)}
              {numberInput('Pharmacists', pharmacists, setPharmacists)}
            </div>
          </div>

          {/* Infrastructure */}
          <div className={sectionClass}>
            {sectionTitle(<Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />, 'Infrastructure')}
            <div className="space-y-1">
              {toggle('Has Electricity', hasElectricity, setHasElectricity)}
              {hasElectricity && (
                <div className="pl-4 pb-2">
                  {numberInput('Electricity Hours/Day', electricityHours, setElectricityHours, 24)}
                </div>
              )}
              {toggle('Has Generator', hasGenerator, setHasGenerator)}
              {toggle('Has Solar Power', hasSolar, setHasSolar)}
              {toggle('Has Internet', hasInternet, setHasInternet)}
              {hasInternet && (
                <div className="pl-4 pb-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Internet Type</label>
                  <select
                    value={internetType}
                    onChange={e => setInternetType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select type</option>
                    <option value="fiber">Fiber</option>
                    <option value="4g">4G/LTE</option>
                    <option value="3g">3G</option>
                    <option value="satellite">Satellite</option>
                    <option value="dsl">DSL</option>
                  </select>
                </div>
              )}
              {toggle('Has Ambulance', hasAmbulance, setHasAmbulance)}
              {toggle('24hr Emergency', emergency24hr, setEmergency24hr)}
            </div>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <div className={sectionClass}>
              {sectionTitle(<CheckCircle className="w-4 h-4" style={{ color: '#3ECF8E' }} />, 'Services Offered')}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                {toggle('EPI (Immunization)', serviceFlags.epi, () => toggleService('epi'))}
                {toggle('Antenatal Care', serviceFlags.anc, () => toggleService('anc'))}
                {toggle('Delivery Services', serviceFlags.delivery, () => toggleService('delivery'))}
                {toggle('HIV/AIDS', serviceFlags.hiv, () => toggleService('hiv'))}
                {toggle('Tuberculosis', serviceFlags.tb, () => toggleService('tb'))}
                {toggle('Emergency Surgery', serviceFlags.emergencySurgery, () => toggleService('emergencySurgery'))}
                {toggle('Laboratory', serviceFlags.laboratory, () => toggleService('laboratory'))}
                {toggle('Pharmacy', serviceFlags.pharmacy, () => toggleService('pharmacy'))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
