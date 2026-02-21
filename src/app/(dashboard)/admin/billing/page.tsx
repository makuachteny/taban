'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import type { OrganizationDoc } from '@/lib/db-types';
import {
  CreditCard, Search, Edit3, Check, X,
  Building2, Users, TrendingUp
} from 'lucide-react';

export default function AdminBillingPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { organizations, loading, update } = useOrganizations();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<'basic' | 'professional' | 'enterprise'>('basic');
  const [editStatus, setEditStatus] = useState<'trial' | 'active' | 'suspended' | 'cancelled'>('trial');
  const [editMaxUsers, setEditMaxUsers] = useState(50);
  const [editMaxHospitals, setEditMaxHospitals] = useState(10);
  const [saving, setSaving] = useState(false);

  // Access control
  useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const filteredOrgs = useMemo(() => {
    if (!search) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(o => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));
  }, [organizations, search]);

  if (!currentUser || currentUser.role !== 'super_admin') return null;

  const startEdit = (org: OrganizationDoc) => {
    setEditingId(org._id);
    setEditPlan(org.subscriptionPlan);
    setEditStatus(org.subscriptionStatus);
    setEditMaxUsers(org.maxUsers);
    setEditMaxHospitals(org.maxHospitals);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (orgId: string) => {
    setSaving(true);
    try {
      await update(orgId, {
        subscriptionPlan: editPlan,
        subscriptionStatus: editStatus,
        maxUsers: editMaxUsers,
        maxHospitals: editMaxHospitals,
      }, currentUser._id, currentUser.username);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Summary stats
  const planRevenue: Record<string, { count: number; color: string }> = {
    enterprise: { count: organizations.filter(o => o.subscriptionPlan === 'enterprise' && o.subscriptionStatus === 'active').length, color: '#7C3AED' },
    professional: { count: organizations.filter(o => o.subscriptionPlan === 'professional' && o.subscriptionStatus === 'active').length, color: '#2563EB' },
    basic: { count: organizations.filter(o => o.subscriptionPlan === 'basic' && o.subscriptionStatus === 'active').length, color: '#6B7280' },
  };

  const totalActive = organizations.filter(o => o.subscriptionStatus === 'active').length;
  const totalTrial = organizations.filter(o => o.subscriptionStatus === 'trial').length;
  const totalSuspended = organizations.filter(o => o.subscriptionStatus === 'suspended').length;
  const totalMaxUsers = organizations.reduce((sum, o) => sum + o.maxUsers, 0);

  const inputStyle: React.CSSProperties = {
    background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)',
    borderRadius: '8px', padding: '6px 10px', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none' as const, paddingRight: '28px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
  };

  return (
    <>
      <TopBar title="Billing & Subscriptions" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Subscriptions', value: totalActive, icon: CreditCard, accent: '#059669' },
            { label: 'Trial Organizations', value: totalTrial, icon: TrendingUp, accent: '#D97706' },
            { label: 'Suspended', value: totalSuspended, icon: Building2, accent: '#EF4444' },
            { label: 'Total Licensed Users', value: totalMaxUsers, icon: Users, accent: '#2563EB' },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.accent}15` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Active Subscriptions by Plan</p>
          <div className="flex gap-6">
            {Object.entries(planRevenue).map(([plan, info]) => (
              <div key={plan} className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1" style={{ background: `${info.color}08`, border: `1px solid ${info.color}20` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: info.color }} />
                <div>
                  <p className="text-xs font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>{plan}</p>
                  <p className="text-xl font-bold" style={{ color: info.color }}>{info.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1" style={{ maxWidth: '360px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search organizations..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '36px', width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full">
              <thead>
                <tr>
                  {['Organization', 'Plan', 'Status', 'Max Users', 'Max Hospitals', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredOrgs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No organizations found</td></tr>
                ) : filteredOrgs.map(org => {
                  const isEditing = editingId === org._id;
                  return (
                    <tr key={org._id} style={{ borderBottom: '1px solid var(--border-light)' }} className="transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: org.primaryColor }}>
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{org.country}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select value={editPlan} onChange={e => setEditPlan(e.target.value as typeof editPlan)} style={selectStyle}>
                            <option value="basic">Basic</option>
                            <option value="professional">Professional</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                            background: org.subscriptionPlan === 'enterprise' ? 'rgba(124,58,237,0.12)' : org.subscriptionPlan === 'professional' ? 'rgba(37,99,235,0.12)' : 'rgba(107,114,128,0.12)',
                            color: org.subscriptionPlan === 'enterprise' ? '#7C3AED' : org.subscriptionPlan === 'professional' ? '#2563EB' : '#6B7280',
                          }}>{org.subscriptionPlan}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value as typeof editStatus)} style={selectStyle}>
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full" style={{
                              background: org.subscriptionStatus === 'active' ? '#10B981' : org.subscriptionStatus === 'trial' ? '#F59E0B' : '#EF4444',
                            }} />
                            <span style={{
                              color: org.subscriptionStatus === 'active' ? '#10B981' : org.subscriptionStatus === 'trial' ? '#F59E0B' : '#EF4444',
                            }}>{org.subscriptionStatus}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" min="1" value={editMaxUsers} onChange={e => setEditMaxUsers(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: '80px' }} />
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{org.maxUsers}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" min="1" value={editMaxHospitals} onChange={e => setEditMaxHospitals(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: '80px' }} />
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{org.maxHospitals}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => saveEdit(org._id)} disabled={saving} className="p-1.5 rounded-lg transition-colors" style={{ color: '#059669' }}>
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: '#EF4444' }}>
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(org)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
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
