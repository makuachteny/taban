'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { FlaskConical, Clock, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { useLabResults } from '@/lib/hooks/useLabResults';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function LabPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { globalSearch } = useApp();
  const { results: labResults, update: updateLabResult } = useLabResults();
  const { canEnterLabResults } = usePermissions();
  const router = useRouter();

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

  return (
    <>
      <TopBar title="Laboratory" />
      <main className="page-container page-enter">
          <h1 className="text-xl font-semibold mb-1">Laboratory Information System</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Manage lab orders, track specimens, and view results</p>

          {/* Stats */}
          <div className="kpi-grid mb-4">
            {[
              { label: 'Pending Orders', value: pending, icon: Clock, color: '#FCD34D', bg: 'rgba(252,211,77,0.10)' },
              { label: 'In Progress', value: inProgress, icon: FlaskConical, color: '#0077D7', bg: 'rgba(43,111,224,0.10)' },
              { label: 'Completed Today', value: completed, icon: CheckCircle2, color: '#0077D7', bg: 'rgba(43,111,224,0.12)' },
              { label: 'Abnormal Results', value: abnormal, icon: AlertTriangle, color: '#E52E42', bg: 'rgba(229,46,66,0.10)' },
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
                      background: filter === f.id ? '#0077D7' : 'transparent',
                      color: filter === f.id ? 'white' : 'var(--text-secondary)',
                      border: filter === f.id ? 'none' : '1px solid var(--border-light)',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                      <p className="text-xs font-mono" style={{ color: '#0077D7' }}>{order.hospitalNumber}</p>
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
                          <p className="text-sm" style={{ color: order.abnormal ? '#EF4444' : 'inherit', fontWeight: order.abnormal ? 600 : 400 }}>{order.result}</p>
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
                      <td>
                        {order.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                            onClick={() => updateLabResult(order._id, { status: 'in_progress' })}>Accept</button>
                        )}
                        {order.status === 'in_progress' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#0077D7' }}
                            onClick={() => {
                              const result = prompt('Enter lab result:');
                              if (result) {
                                updateLabResult(order._id, {
                                  status: 'completed',
                                  result,
                                  completedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                });
                              }
                            }}>Enter Result</button>
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
