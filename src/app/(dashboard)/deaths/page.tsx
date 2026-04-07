'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { useDeaths } from '@/lib/hooks/useDeaths';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useApp } from '@/lib/context';
import { COMMON_ICD11_CODES } from '@/lib/icd11-codes';
import { Plus, Search, X, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function DeathsPage() {
  const { deaths, stats, register } = useDeaths();
  const { hospitals } = useHospitals();
  const { currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedDeath, setExpandedDeath] = useState<string | null>(null);
  const [form, setForm] = useState({
    deceasedFirstName: '', deceasedSurname: '', deceasedGender: 'Male' as 'Male' | 'Female',
    dateOfBirth: '', dateOfDeath: new Date().toISOString().slice(0, 10), ageAtDeath: 0,
    placeOfDeath: '', facilityId: '', facilityName: '',
    immediateCause: '', immediateICD11: '', antecedentCause1: '', antecedentICD11_1: '',
    antecedentCause2: '', antecedentICD11_2: '', underlyingCause: '', underlyingICD11: '',
    contributingConditions: '', contributingICD11: '',
    mannerOfDeath: 'natural' as const, maternalDeath: false, pregnancyRelated: false,
    certifiedBy: '', certifierRole: '', state: '', county: '', certificateNumber: '',
    deathNotified: true, deathRegistered: false,
  });

  const filtered = (deaths || []).filter(d =>
    !search || `${d.deceasedFirstName} ${d.deceasedSurname}`.toLowerCase().includes(search.toLowerCase()) ||
    (d.certificateNumber || '').toLowerCase().includes(search.toLowerCase()) || (d.underlyingICD11 || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.deceasedFirstName || !form.immediateCause) return;
    const fac = hospitals.find(h => h._id === (form.facilityId || currentUser?.hospitalId));
    await register({
      ...form,
      facilityId: fac?._id || currentUser?.hospitalId || '',
      facilityName: fac?.name || currentUser?.hospitalName || '',
      state: fac?.state || form.state,
      certifiedBy: form.certifiedBy || currentUser?.name || '',
      certificateNumber: form.certificateNumber || `SS-D-${Date.now().toString(36).toUpperCase()}`,
    });
    setShowForm(false);
  };

  const ICD11Select = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
        <option value="">Select ICD-11 code...</option>
        {COMMON_ICD11_CODES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.title}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <TopBar title="Death Registration" />
      <main className="page-container page-enter">
        <div className="flex items-center justify-between mb-6">
          <div className="page-header">
            <div className="page-header__top">
              <div className="page-header__icon"><FileText size={18} /></div>
              <h1 className="page-header__title">Death Registration</h1>
            </div>
            <p className="page-header__subtitle">WHO Medical Certificate of Cause of Death with ICD-11 Coding</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Death
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="card-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Deaths</p>
              <p className="text-2xl font-bold" style={{ color: '#E52E42' }}>{stats.total}</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Maternal Deaths</p>
              <p className="text-2xl font-bold" style={{ color: '#E52E42' }}>{stats.maternalDeaths}</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Under-5 Deaths</p>
              <p className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{stats.under5Deaths}</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>With ICD-11 Code</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.withICD11Code}/{stats.total}</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Registered</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.registered}/{stats.total}</p>
            </div>
          </div>
        )}

        {/* Top causes */}
        {stats && stats.topCauses.length > 0 && (
          <div className="card-elevated p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" style={{ color: '#E52E42' }} /> Top Causes of Death (ICD-11)</h3>
            <div className="grid grid-cols-5 gap-2">
              {stats.topCauses.slice(0, 5).map(c => (
                <div key={c.code} className="p-2 rounded-lg" style={{ background: 'rgba(229,46,66,0.08)' }}>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.15)', color: '#E52E42' }}>{c.code}</span>
                  <p className="text-xs font-medium mt-1">{c.cause}</p>
                  <p className="text-lg font-bold" style={{ color: '#E52E42' }}>{c.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name, certificate, or ICD code..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Certificate #</th>
                <th>Deceased</th>
                <th>Age</th>
                <th>Date of Death</th>
                <th>Cause (ICD-11)</th>
                <th>Manner</th>
                <th>Facility</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id} className="cursor-pointer hover:bg-[var(--table-row-hover)]" onClick={() => setExpandedDeath(expandedDeath === d._id ? null : d._id)}>
                  <td className="font-mono text-xs">{d.certificateNumber}</td>
                  <td className="font-medium text-sm">{d.deceasedFirstName} {d.deceasedSurname}</td>
                  <td className="text-sm">{d.ageAtDeath < 1 ? 'Neonate' : `${d.ageAtDeath}y`}</td>
                  <td className="text-xs font-mono">{d.dateOfDeath}</td>
                  <td>
                    <div>
                      {d.underlyingICD11 && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded mr-1" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{d.underlyingICD11}</span>}
                      <span className="text-xs">{d.underlyingCause || d.immediateCause}</span>
                    </div>
                  </td>
                  <td className="text-xs capitalize">{(d.mannerOfDeath || '').replace(/_/g, ' ')}</td>
                  <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{(d.facilityName || '').replace(' Hospital', '').replace(' Teaching', '')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className={`badge text-[10px] ${d.deathRegistered ? 'badge-normal' : 'badge-warning'}`}>
                        {d.deathRegistered ? 'Yes' : 'No'}
                      </span>
                      {expandedDeath === d._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </td>
                </tr>
              ))}
              {expandedDeath && (() => {
                const d = filtered.find(x => x._id === expandedDeath);
                if (!d) return null;
                return (
                  <tr>
                    <td colSpan={8} style={{ background: 'var(--overlay-subtle)', padding: 0 }}>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Full Name</span>{d.deceasedFirstName} {d.deceasedSurname}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Gender</span>{d.deceasedGender}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Date of Birth</span>{d.dateOfBirth || 'N/A'}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Place of Death</span>{d.placeOfDeath || d.facilityName}</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(229,46,66,0.06)', border: '1px solid rgba(229,46,66,0.15)' }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: '#E52E42' }}>Cause of Death Chain (WHO)</p>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium">a) Immediate:</span> {d.immediateCause} {d.immediateICD11 && <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{d.immediateICD11}</span>}</p>
                            {d.antecedentCause1 && <p><span className="font-medium">b) Due to:</span> {d.antecedentCause1} {d.antecedentICD11_1 && <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{d.antecedentICD11_1}</span>}</p>}
                            {d.antecedentCause2 && <p><span className="font-medium">c) Due to:</span> {d.antecedentCause2} {d.antecedentICD11_2 && <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{d.antecedentICD11_2}</span>}</p>}
                            {d.underlyingCause && <p><span className="font-medium">d) Underlying:</span> {d.underlyingCause} {d.underlyingICD11 && <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>{d.underlyingICD11}</span>}</p>}
                            {d.contributingConditions && <p><span className="font-medium">Contributing:</span> {d.contributingConditions}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Manner</span><span className="capitalize">{(d.mannerOfDeath || '').replace(/_/g, ' ')}</span></div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Maternal Death</span>{d.maternalDeath ? 'Yes' : 'No'}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Certified By</span>{d.certifiedBy || 'N/A'} ({d.certifierRole || 'N/A'})</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Location</span>{d.county || 'N/A'}, {d.state}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Death Registration Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2"><FileText className="w-5 h-5" style={{ color: '#E52E42' }} /><h2 className="font-semibold">WHO Medical Certificate of Cause of Death</h2></div>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
              </div>
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Deceased Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>First Name *</label><input type="text" value={form.deceasedFirstName} onChange={e => setForm({ ...form, deceasedFirstName: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Surname</label><input type="text" value={form.deceasedSurname} onChange={e => setForm({ ...form, deceasedSurname: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Gender</label><select value={form.deceasedGender} onChange={e => setForm({ ...form, deceasedGender: e.target.value as 'Male' | 'Female' })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Date of Death</label><input type="date" value={form.dateOfDeath} onChange={e => setForm({ ...form, dateOfDeath: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Age at Death</label><input type="number" value={form.ageAtDeath} onChange={e => setForm({ ...form, ageAtDeath: Number(e.target.value) })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                  <div><label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Manner of Death</label><select value={form.mannerOfDeath} onChange={e => setForm({ ...form, mannerOfDeath: e.target.value as typeof form.mannerOfDeath })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}><option value="natural">Natural</option><option value="accident">Accident</option><option value="intentional_self_harm">Intentional self-harm</option><option value="assault">Assault</option><option value="pending_investigation">Pending investigation</option><option value="unknown">Unknown</option></select></div>
                </div>

                <h3 className="text-sm font-semibold pt-2" style={{ color: 'var(--text-secondary)' }}>Cause of Death Chain (WHO Format)</h3>
                <div className="p-3 rounded-lg space-y-3" style={{ background: 'rgba(229,46,66,0.05)', border: '1px solid rgba(229,46,66,0.15)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Line a: Immediate cause *</label><input type="text" value={form.immediateCause} onChange={e => setForm({ ...form, immediateCause: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} placeholder="Disease or condition directly leading to death" /></div>
                    <ICD11Select value={form.immediateICD11} onChange={v => setForm({ ...form, immediateICD11: v })} label="ICD-11 Code (Line a)" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Line b: Due to (or as consequence of)</label><input type="text" value={form.antecedentCause1} onChange={e => setForm({ ...form, antecedentCause1: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                    <ICD11Select value={form.antecedentICD11_1} onChange={v => setForm({ ...form, antecedentICD11_1: v })} label="ICD-11 Code (Line b)" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Line c: Due to (or as consequence of)</label><input type="text" value={form.antecedentCause2} onChange={e => setForm({ ...form, antecedentCause2: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                    <ICD11Select value={form.antecedentICD11_2} onChange={v => setForm({ ...form, antecedentICD11_2: v })} label="ICD-11 Code (Line c)" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Line d: Underlying cause</label><input type="text" value={form.underlyingCause} onChange={e => setForm({ ...form, underlyingCause: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                    <ICD11Select value={form.underlyingICD11} onChange={v => setForm({ ...form, underlyingICD11: v })} label="ICD-11 Code (Line d)" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Contributing conditions</label><input type="text" value={form.contributingConditions} onChange={e => setForm({ ...form, contributingConditions: e.target.value })} className="w-full p-2 rounded-lg text-sm outline-none" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} /></div>
                    <ICD11Select value={form.contributingICD11} onChange={v => setForm({ ...form, contributingICD11: v })} label="ICD-11 Code (Contributing)" />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.maternalDeath} onChange={e => setForm({ ...form, maternalDeath: e.target.checked })} /> Maternal death</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pregnancyRelated} onChange={e => setForm({ ...form, pregnancyRelated: e.target.checked })} /> Pregnancy-related</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.deathNotified} onChange={e => setForm({ ...form, deathNotified: e.target.checked })} /> Death notified</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.deathRegistered} onChange={e => setForm({ ...form, deathRegistered: e.target.checked })} /> Death registered</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={handleSubmit} className="btn btn-primary btn-sm" style={{ opacity: !form.deceasedFirstName || !form.immediateCause ? 0.5 : 1 }}>Register Death</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
