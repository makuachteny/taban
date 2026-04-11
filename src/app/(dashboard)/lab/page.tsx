'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { FlaskConical, Clock, CheckCircle2, AlertTriangle, Search, X } from 'lucide-react';
import { useLabResults } from '@/lib/hooks/useLabResults';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ResultDraft {
  orderId: string;
  patientName: string;
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
}

export default function LabPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { globalSearch } = useApp();
  const { results: labResults, update: updateLabResult, loading: labLoading } = useLabResults();
  const { canEnterLabResults } = usePermissions();
  const router = useRouter();
  const [resultDraft, setResultDraft] = useState<ResultDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = labResults.filter(o => {
    const q = search || globalSearch;
    const matchStatus = filter === 'all' || o.status === filter;
    const matchSearch = !q || (o.patientName || '').toLowerCase().includes(q.toLowerCase()) || (o.testName || '').toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pending = labResults.filter(o => o.status === 'pending').length;
  const inProgress = labResults.filter(o => o.status === 'in_progress').length;
  const completed = labResults.filter(o => o.status === 'completed').length;
  const abnormal = labResults.filter(o => o.abnormal).length;

  const submitResult = async () => {
    if (!resultDraft || !resultDraft.result.trim()) return;
    setSubmitting(true);
    try {
      await updateLabResult(resultDraft.orderId, {
        status: 'completed',
        result: resultDraft.result.trim(),
        unit: resultDraft.unit.trim(),
        referenceRange: resultDraft.referenceRange.trim(),
        abnormal: resultDraft.abnormal,
        critical: resultDraft.critical,
        completedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      });
      setResultDraft(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Laboratory" />
      <main className="page-container page-enter">
          <h1 className="text-xl font-semibold mb-1">Laboratory Information System</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Manage lab orders, track specimens, and view results</p>

          {labLoading && (
            <div className="card-elevated p-4 mb-4 flex items-center gap-3" style={{ background: 'var(--overlay-subtle)' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading lab orders…</span>
            </div>
          )}

          {/* Stats */}
          <div className="kpi-grid mb-4">
            {[
              { label: 'Pending Orders', value: pending, icon: Clock, color: 'var(--color-warning)', bg: 'rgba(252,211,77,0.10)' },
              { label: 'In Progress', value: inProgress, icon: FlaskConical, color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.10)' },
              { label: 'Completed Today', value: completed, icon: CheckCircle2, color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)' },
              { label: 'Abnormal Results', value: abnormal, icon: AlertTriangle, color: 'var(--color-danger)', bg: 'rgba(229,46,66,0.10)' },
            ].map(s => (
              <div key={s.label} className="kpi cursor-pointer" onClick={() => {
              const filterMap: Record<string, string> = { 'Pending Orders': 'pending', 'In Progress': 'in_progress', 'Completed Today': 'completed', 'Abnormal Results': 'completed' };
              setFilter(filterMap[s.label] || 'all');
            }}>
                <div className="kpi__icon" style={{ background: s.bg }}>
                  <s.icon style={{ color: s.color }} />
                </div>
                <div className="kpi__body">
                  <div className="kpi__value">{s.value}</div>
                  <div className="kpi__label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card-elevated p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type="search" placeholder="Search by patient or test name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 search-icon-input" style={{ background: 'var(--overlay-subtle)' }} />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'completed', label: 'Completed' },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: filter === f.id ? 'var(--accent-primary)' : 'transparent',
                      color: filter === f.id ? 'white' : 'var(--text-secondary)',
                      border: filter === f.id ? 'none' : '1px solid var(--border-light)',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Entry Modal */}
          {resultDraft && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', padding: 24 }}
              onClick={(e) => { if (e.target === e.currentTarget && !submitting) setResultDraft(null); }}
            >
              <div
                className="card-elevated"
                style={{
                  width: '100%', maxWidth: 520, padding: 28, borderRadius: 16,
                  background: 'var(--bg-card)', position: 'relative',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1)',
                  maxHeight: '90vh', overflowY: 'auto',
                }}
              >
                <button
                  onClick={() => !submitting && setResultDraft(null)}
                  className="absolute"
                  style={{ top: 14, right: 14, width: 30, height: 30, borderRadius: 6, background: 'var(--overlay-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  title="Close"
                  disabled={submitting}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                    <FlaskConical className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Enter Lab Result</h3>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{resultDraft.testName} · {resultDraft.patientName}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-5">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Result *</label>
                    <input
                      type="text"
                      autoFocus
                      value={resultDraft.result}
                      onChange={(e) => setResultDraft({ ...resultDraft, result: e.target.value })}
                      placeholder="e.g. 12.4"
                      className="w-full p-2.5 rounded-lg outline-none text-sm"
                      style={{
                        background: 'var(--overlay-subtle)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Unit</label>
                      <input
                        type="text"
                        value={resultDraft.unit}
                        onChange={(e) => setResultDraft({ ...resultDraft, unit: e.target.value })}
                        placeholder="e.g. mg/dL"
                        className="w-full p-2.5 rounded-lg outline-none text-sm"
                        style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Reference Range</label>
                      <input
                        type="text"
                        value={resultDraft.referenceRange}
                        onChange={(e) => setResultDraft({ ...resultDraft, referenceRange: e.target.value })}
                        placeholder="e.g. 7-10"
                        className="w-full p-2.5 rounded-lg outline-none text-sm"
                        style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={resultDraft.abnormal}
                        onChange={(e) => setResultDraft({ ...resultDraft, abnormal: e.target.checked, critical: e.target.checked ? resultDraft.critical : false })}
                      />
                      Abnormal
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)', opacity: resultDraft.abnormal ? 1 : 0.5 }}>
                      <input
                        type="checkbox"
                        checked={resultDraft.critical}
                        disabled={!resultDraft.abnormal}
                        onChange={(e) => setResultDraft({ ...resultDraft, critical: e.target.checked })}
                      />
                      Critical
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button
                    onClick={() => setResultDraft(null)}
                    disabled={submitting}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitResult}
                    disabled={submitting || !resultDraft.result.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ opacity: submitting || !resultDraft.result.trim() ? 0.6 : 1 }}
                  >
                    {submitting ? 'Saving…' : 'Save Result'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lab Orders Table */}
          <div className="card-elevated overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Specimen</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Ordered By</th>
                  <th>Time</th>
                  {canEnterLabResults && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => { if (order.patientId) router.push(`/patients/${order.patientId}`); }}>
                    <td>
                      <p className="font-medium text-sm">{order.patientName}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--accent-primary)' }}>{order.hospitalNumber}</p>
                    </td>
                    <td className="font-medium text-sm">{order.testName}</td>
                    <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{order.specimen}</td>
                    <td>
                      <span className={`badge text-[10px] ${
                        order.status === 'pending' ? 'badge-warning' :
                        order.status === 'in_progress' ? 'badge-syncing' :
                        'badge-normal'
                      }`}>
                        {order.status === 'in_progress' ? 'Processing' : order.status === 'pending' ? 'Pending' : 'Completed'}
                      </span>
                    </td>
                    <td>
                      {order.result ? (
                        <div>
                          <p className="text-sm" style={{ color: order.abnormal ? 'var(--color-danger)' : 'inherit', fontWeight: order.abnormal ? 600 : 400 }}>{order.result}</p>
                          {order.abnormal && <span className="badge badge-emergency text-[9px] mt-0.5">Abnormal</span>}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{order.orderedBy}</td>
                    <td>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{order.orderedAt}</p>
                      {order.completedAt && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Done: {order.completedAt}</p>
                      )}
                    </td>
                    {canEnterLabResults && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {order.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                            onClick={() => updateLabResult(order._id, { status: 'in_progress' })}>Accept</button>
                        )}
                        {order.status === 'in_progress' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'var(--accent-primary)' }}
                            onClick={() => setResultDraft({
                              orderId: order._id,
                              patientName: order.patientName || '',
                              testName: order.testName || '',
                              result: '',
                              unit: order.unit || '',
                              referenceRange: order.referenceRange || '',
                              abnormal: false,
                              critical: false,
                            })}
                          >
                            Enter Result
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </main>
    </>
  );
}
