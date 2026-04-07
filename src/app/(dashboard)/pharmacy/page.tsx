'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { Pill, AlertTriangle, Search, TrendingDown, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { usePrescriptions } from '@/lib/hooks/usePrescriptions';
import { medications } from '@/data/mock';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  unit: string;
  reorderLevel: number;
  expiryDate: string;
  batchNumber: string;
  status: 'adequate' | 'low' | 'critical' | 'expired';
  dispensedToday: number;
}

const inventory: InventoryItem[] = medications.slice(0, 20).map((med, i) => {
  const stockLevel = Math.floor(Math.random() * 500);
  const reorderLevel = 50 + Math.floor(Math.random() * 100);
  const isLow = stockLevel < reorderLevel;
  const isCritical = stockLevel < reorderLevel * 0.3;
  const year = Math.random() > 0.1 ? '2027' : '2025';
  const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  return {
    id: `inv-${String(i + 1).padStart(3, '0')}`,
    name: med.name,
    category: med.category,
    stockLevel,
    unit: ['tablets', 'vials', 'bottles', 'sachets', 'tubes'][Math.floor(Math.random() * 5)],
    reorderLevel,
    expiryDate: `${year}-${month}-28`,
    batchNumber: `BN${2024 + Math.floor(Math.random() * 3)}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    status: year === '2025' ? 'expired' : isCritical ? 'critical' : isLow ? 'low' : 'adequate',
    dispensedToday: Math.floor(Math.random() * 30),
  };
});

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory'>('queue');
  const [search, setSearch] = useState('');
  const { globalSearch } = useApp();
  const { canDispense } = usePermissions();
  const router = useRouter();
  const { prescriptions: rxQueue, loading: rxLoading, dispense } = usePrescriptions();

  const q = search || globalSearch;

  const handleDispense = async (rxId: string) => {
    await dispense(rxId);
    const rx = rxQueue.find(r => r._id === rxId);
    if (rx) {
      const { logAudit } = await import('@/lib/services/audit-service');
      logAudit('DISPENSE_PRESCRIPTION', undefined, undefined, `Dispensed ${rx.medication} to ${rx.patientName} (${rxId})`).catch(() => {});
    }
  };

  const pendingRx = rxQueue.filter(r => r.status === 'pending').length;
  const dispensedRx = rxQueue.filter(r => r.status === 'dispensed').length;
  const lowStock = inventory.filter(i => i.status === 'low' || i.status === 'critical').length;
  const expiredItems = inventory.filter(i => i.status === 'expired').length;

  const filteredInventory = inventory.filter(i =>
    !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase())
  );

  const filteredQueue = rxQueue.filter(rx =>
    !q || rx.patientName.toLowerCase().includes(q.toLowerCase()) || rx.medication.toLowerCase().includes(q.toLowerCase()) || rx.prescribedBy.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <TopBar title="Pharmacy" />
      <main className="page-container page-enter">
          <div className="page-header mb-5">
            <div className="page-header__top">
              <div className="page-header__icon"><Pill size={18} /></div>
              <h1 className="page-header__title">Pharmacy Management</h1>
            </div>
            <p className="page-header__subtitle">Dispense medications and manage inventory</p>
          </div>

          {/* Stats */}
          <div className="kpi-grid mb-4">
            {[
              { label: 'Pending Prescriptions', value: pendingRx, icon: Pill, color: '#FCD34D', bg: 'rgba(252,211,77,0.10)' },
              { label: 'Dispensed Today', value: dispensedRx, icon: CheckCircle2, color: '#0077D7', bg: 'rgba(0,119,215,0.12)' },
              { label: 'Low Stock Items', value: lowStock, icon: TrendingDown, color: '#E52E42', bg: 'rgba(229,46,66,0.10)' },
              { label: 'Expired Items', value: expiredItems, icon: AlertTriangle, color: '#F87171', bg: 'rgba(229,46,66,0.12)' },
            ].map(s => (
              <div key={s.label} className="kpi cursor-pointer" onClick={() => {
                const tabMap: Record<string, 'queue' | 'inventory'> = { 'Pending Prescriptions': 'queue', 'Dispensed Today': 'queue', 'Low Stock Items': 'inventory', 'Expired Items': 'inventory' };
                setActiveTab(tabMap[s.label] || 'queue');
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

          {/* Tabs */}
          <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border-light)' }}>
            <button onClick={() => setActiveTab('queue')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'queue' ? 'tab-active' : ''}`}
              style={{ color: activeTab === 'queue' ? '#0077D7' : 'var(--text-muted)' }}>
              Prescription Queue ({pendingRx})
            </button>
            <button onClick={() => setActiveTab('inventory')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'inventory' ? 'tab-active' : ''}`}
              style={{ color: activeTab === 'inventory' ? '#0077D7' : 'var(--text-muted)' }}>
              Inventory ({inventory.length})
            </button>
          </div>

          {activeTab === 'queue' && (
            <div className="card-elevated overflow-hidden">
              {rxLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Prescribed By</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No prescriptions found. Prescriptions will appear here when doctors save consultations.
                      </td>
                    </tr>
                  ) : filteredQueue.map(rx => (
                    <tr key={rx._id} className="cursor-pointer hover:bg-[var(--table-row-hover)]" onClick={() => { if (rx.patientId) router.push(`/patients/${rx.patientId}`); }}>
                      <td className="font-medium text-sm" style={{ color: '#0077D7' }}>{rx.patientName}</td>
                      <td className="text-sm">{rx.medication}</td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {rx.dose} {rx.frequency} {rx.duration ? `x ${rx.duration}` : ''}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rx.prescribedBy}</td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${rx.status === 'pending' ? 'badge-warning' : 'badge-normal'}`}>
                          {rx.status === 'pending' ? 'Pending' : 'Dispensed'}
                        </span>
                      </td>
                      <td>
                        {rx.status === 'pending' && canDispense && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                            onClick={(e) => { e.stopPropagation(); handleDispense(rx._id); }}>Dispense</button>
                        )}
                        {rx.status === 'pending' && !canDispense && (
                          <span className="text-[10px] font-medium px-2 py-1 rounded" style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)' }}>Pharmacist only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <>
              <div className="card-elevated p-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input type="search" placeholder="Search medications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 search-icon-input" style={{ background: 'var(--overlay-subtle)' }} />
                </div>
              </div>
              <div className="card-elevated overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th>Dispensed Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => (
                      <tr key={item.id}>
                        <td className="font-medium text-sm">{item.name}</td>
                        <td><span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--overlay-medium)', color: 'var(--text-secondary)' }}>{item.category}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: item.status === 'critical' ? '#EF4444' : item.status === 'low' ? '#F59E0B' : 'inherit' }}>
                              {item.stockLevel}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                          </div>
                          {/* Stock bar */}
                          <div className="w-20 h-1.5 rounded-full mt-1" style={{ background: 'var(--overlay-medium)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${Math.min(100, (item.stockLevel / (item.reorderLevel * 3)) * 100)}%`,
                              background: item.status === 'critical' ? '#EF4444' : item.status === 'low' ? '#FCD34D' : '#4ADE80',
                            }} />
                          </div>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.reorderLevel} {item.unit}</td>
                        <td>
                          <span className={`badge text-[10px] ${
                            item.status === 'adequate' ? 'badge-normal' :
                            item.status === 'low' ? 'badge-warning' :
                            item.status === 'critical' ? 'badge-emergency' :
                            'badge-emergency'
                          }`}>
                            {item.status === 'adequate' ? 'In Stock' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{item.batchNumber}</td>
                        <td className="text-xs" style={{ color: item.status === 'expired' ? '#EF4444' : 'var(--text-muted)' }}>
                          {item.expiryDate}
                        </td>
                        <td className="text-center font-semibold text-sm">{item.dispensedToday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
      </main>
    </>
  );
}
