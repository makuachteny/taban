'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { Search, Filter, ChevronRight, UserPlus, Users } from 'lucide-react';
import { usePatients } from '@/lib/hooks/usePatients';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { states } from '@/data/mock';

export default function PatientsPage() {
  const router = useRouter();
  const { globalSearch } = useApp();
  const { patients } = usePatients();
  const { canRegisterPatients } = usePermissions();
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="page-header">
              <div className="page-header__top">
                <div className="page-header__icon"><Users size={18} /></div>
                <h1 className="page-header__title">Patient Registry</h1>
              </div>
              <p className="page-header__subtitle">{filtered.length} patients found</p>
            </div>
            {canRegisterPatients && (
              <button onClick={() => router.push('/patients/new')} className="btn btn-primary">
                <UserPlus className="w-4 h-4" />
                Register New Patient
              </button>
            )}
          </div>

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
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: 'var(--accent-primary)' }}>
                              {(patient.firstName || '?')[0]}{(patient.surname || '?')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{patient.firstName} {patient.surname}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{patient.tribe}</p>
                            </div>
                          </div>
                        </td>
                        <td className="col-hospital"><span className="font-mono text-xs whitespace-nowrap" style={{ color: 'var(--accent-primary)' }}>{patient.hospitalNumber}</span></td>
                        <td className="col-age whitespace-nowrap">{age}y · {patient.gender[0]}</td>
                        <td className="col-state text-xs">{patient.state}</td>
                        <td className="col-phone hide-mobile font-mono text-xs">{patient.phone}</td>
                        <td className="col-visit hide-mobile text-xs">{patient.lastVisitDate}</td>
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
    </>
  );
}
