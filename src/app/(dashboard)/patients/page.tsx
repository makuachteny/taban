'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import PageHeader from '@/components/PageHeader';
import { Search, Filter, ChevronRight, UserPlus, Users, ScanLine, Hash, X, ArrowRight } from 'lucide-react';
import { usePatients } from '@/lib/hooks/usePatients';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { states } from '@/data/mock';
import QRScanner from '@/components/QRScanner';

export default function PatientsPage() {
  const router = useRouter();
  const { globalSearch } = useApp();
  const { patients } = usePatients();
  const { canRegisterPatients } = usePermissions();
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFindPatient, setShowFindPatient] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState('');

  const handleLookup = () => {
    const q = lookupId.trim().toLowerCase();
    if (!q) { setLookupError('Enter a Hospital Number or Geocode ID'); return; }
    const match = patients.find(p =>
      p.hospitalNumber?.toLowerCase() === q ||
      p.geocodeId?.toLowerCase() === q ||
      p.nationalId?.toLowerCase() === q ||
      p._id?.toLowerCase() === q
    );
    if (match) {
      setShowFindPatient(false);
      setLookupId('');
      setLookupError('');
      router.push(`/patients/${match._id}`);
    } else {
      setLookupError(`No patient found with ID "${lookupId.trim()}"`);
    }
  };

  const filtered = patients.filter(p => {
    const q = search || globalSearch;
    const matchSearch = !q ||
      `${p.firstName} ${p.middleName || ''} ${p.surname}`.toLowerCase().includes(q.toLowerCase()) ||
      (p.hospitalNumber || '').toLowerCase().includes(q.toLowerCase()) ||
      (p.phone || '').includes(q);
    const matchState = !filterState || p.state === filterState;
    const matchGender = !filterGender || p.gender === filterGender;
    return matchSearch && matchState && matchGender;
  });

  return (
    <>
      <TopBar title="Patients" />
      <main className="page-container page-enter">
          <PageHeader
            icon={Users}
            title="Patient Registry"
            subtitle={`${filtered.length} patients found`}
            actions={
              <div className="flex gap-2">
                <button onClick={() => setShowFindPatient(true)} className="btn btn-secondary">
                  <Hash className="w-4 h-4" />
                  Find Patient
                </button>
                {canRegisterPatients && (
                  <button onClick={() => router.push('/patients/new')} className="btn btn-primary">
                    <UserPlus className="w-4 h-4" />
                    Register New Patient
                  </button>
                )}
              </div>
            }
          />

          {/* Search & Filter */}
          <div className="card-elevated p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="search"
                  placeholder="Search by name, hospital number, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 search-icon-input"
                  style={{ background: 'var(--overlay-subtle)' }}
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary btn-sm">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
            {showFilters && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="w-full sm:w-48">
                  <label>State</label>
                  <select value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-36">
                  <label>Gender</label>
                  <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => { setFilterState(''); setFilterGender(''); }} className="btn btn-secondary btn-sm">
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Patient Table */}
          <div className="card-elevated overflow-hidden">
            <div className="patient-table-wrap">
              <table className="data-table patient-table">
                <thead>
                  <tr>
                    <th className="col-patient">Patient</th>
                    <th className="col-hospital">Hospital No.</th>
                    <th className="col-age">Age / Gender</th>
                    <th className="col-state">State</th>
                    <th className="col-phone hide-mobile">Phone</th>
                    <th className="col-visit hide-mobile">Last Visit</th>
                    <th className="col-cond hide-mobile">Conditions</th>
                    <th className="col-arrow"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(patient => {
                    const age = patient.estimatedAge || (patient.dateOfBirth ? (new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : 0);
                    return (
                      <tr key={patient._id} className="cursor-pointer" onClick={() => router.push(`/patients/${patient._id}`)}>
                        <td className="col-patient">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{patient.firstName} {patient.surname}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{patient.tribe}</p>
                          </div>
                        </td>
                        <td className="col-hospital"><span className="font-mono text-xs whitespace-nowrap" style={{ color: 'var(--accent-primary)' }}>{patient.hospitalNumber}</span></td>
                        <td className="col-age whitespace-nowrap">{age}y · {patient.gender[0]}</td>
                        <td className="col-state text-xs">{patient.state}</td>
                        <td className="col-phone hide-mobile font-mono text-xs">{patient.phone}</td>
                        <td className="col-visit hide-mobile text-xs">
                          {patient.lastConsultedAt
                            ? new Date(patient.lastConsultedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : patient.lastVisitDate || '—'}
                        </td>
                        <td className="col-cond hide-mobile">
                          {patient.chronicConditions?.length && patient.chronicConditions[0] !== 'None' ? (
                            <span className="badge badge-warning text-[10px]">{patient.chronicConditions[0]}</span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="col-arrow"><ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </main>

      {/* Find Patient Modal — Hospital ID lookup + QR scan */}
      {showFindPatient && !showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg, var(--bg-card))' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="text-sm font-semibold">Find Patient</h3>
              <button onClick={() => { setShowFindPatient(false); setLookupId(''); setLookupError(''); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Hospital ID / Geocode ID Lookup */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Enter Hospital Number, Geocode ID, or National ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={lookupId}
                      onChange={(e) => { setLookupId(e.target.value); setLookupError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      placeholder="e.g. JTH-0001 or BOMA-XY-HH1001"
                      className="pl-9 w-full"
                      autoFocus
                      style={{ background: 'var(--overlay-subtle)' }}
                    />
                  </div>
                  <button onClick={handleLookup} className="btn btn-primary btn-sm px-4">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {lookupError && (
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-danger)' }}>{lookupError}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
              </div>

              {/* QR Code Scan Option */}
              <button
                onClick={() => setShowQRScanner(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--accent-light)]"
                style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                  <ScanLine className="w-5 h-5" style={{ color: 'var(--taban-blue)' }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Scan QR Code</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Use device camera to scan patient QR code</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRScanner && (
        <QRScanner
          onScan={(data) => {
            setShowQRScanner(false);
            setShowFindPatient(false);
            router.push(`/patients/${data.id}`);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </>
  );
}
