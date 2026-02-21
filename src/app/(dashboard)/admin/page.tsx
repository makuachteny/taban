'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import {
  Building2, Users, HeartPulse, CreditCard, ChevronRight,
  TrendingUp, Shield, Activity, Settings, BarChart3
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);

  // Access control: only super_admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Load aggregate counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const { getAllUsers } = await import('@/lib/services/user-service');
        const { getAllPatients } = await import('@/lib/services/patient-service');
        const [users, patients] = await Promise.all([getAllUsers(), getAllPatients()]);
        setTotalUsers(users.length);
        setTotalPatients(patients.length);
      } catch (err) {
        console.error('Failed to load counts:', err);
      } finally {
        setCountsLoading(false);
      }
    };
    loadCounts();
  }, []);

  if (!currentUser || currentUser.role !== 'super_admin') return null;

  const activeOrgs = organizations.filter(o => o.isActive);
  const activeSubscriptions = organizations.filter(o => o.subscriptionStatus === 'active').length;
  const trialOrgs = organizations.filter(o => o.subscriptionStatus === 'trial').length;
  const suspendedOrgs = organizations.filter(o => o.subscriptionStatus === 'suspended').length;

  const planCounts = {
    basic: organizations.filter(o => o.subscriptionPlan === 'basic').length,
    professional: organizations.filter(o => o.subscriptionPlan === 'professional').length,
    enterprise: organizations.filter(o => o.subscriptionPlan === 'enterprise').length,
  };

  const recentOrgs = [...organizations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const quickLinks = [
    { label: 'Organizations', icon: Building2, href: '/admin/organizations', color: '#DC2626' },
    { label: 'All Users', icon: Users, href: '/admin/users', color: '#2563EB' },
    { label: 'System Config', icon: Settings, href: '/admin/system', color: '#7C3AED' },
    { label: 'Billing', icon: CreditCard, href: '/admin/billing', color: '#D97706' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: '#059669' },
  ];

  return (
    <>
      <TopBar title="Super Admin" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <Shield className="w-5 h-5" style={{ color: '#DC2626' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Platform Administration</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Multi-tenant management console
              </p>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Organizations',
              value: orgsLoading ? '...' : organizations.length.toString(),
              sub: `${activeOrgs.length} active`,
              icon: Building2,
              accent: '#DC2626',
            },
            {
              label: 'Total Users',
              value: countsLoading ? '...' : totalUsers.toLocaleString(),
              sub: 'Across all orgs',
              icon: Users,
              accent: '#2563EB',
            },
            {
              label: 'Total Patients',
              value: countsLoading ? '...' : totalPatients.toLocaleString(),
              sub: 'Across all orgs',
              icon: HeartPulse,
              accent: '#059669',
            },
            {
              label: 'Active Subscriptions',
              value: orgsLoading ? '...' : activeSubscriptions.toString(),
              sub: `${trialOrgs} trial, ${suspendedOrgs} suspended`,
              icon: CreditCard,
              accent: '#D97706',
            },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl cursor-pointer" onClick={() => {
              const routes: Record<string, string> = { 'Total Organizations': '/admin/organizations', 'Total Users': '/admin/users', 'Total Patients': '/patients', 'Active Subscriptions': '/admin/billing' };
              if (routes[stat.label]) router.push(routes[stat.label]);
            }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.accent}15` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Recent Organizations Table */}
          <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Organizations</span>
              </div>
              <button onClick={() => router.push('/admin/organizations')} className="text-xs font-medium flex items-center gap-1" style={{ color: '#DC2626' }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {['Name', 'Plan', 'Status', 'Type', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgsLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : recentOrgs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No organizations yet</td></tr>
                ) : recentOrgs.map(org => (
                  <tr key={org._id} className="cursor-pointer transition-colors" onClick={() => router.push('/admin/organizations')}
                      style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: org.primaryColor || '#DC2626' }}>
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                        background: org.subscriptionPlan === 'enterprise' ? 'rgba(124,58,237,0.12)' : org.subscriptionPlan === 'professional' ? 'rgba(37,99,235,0.12)' : 'rgba(107,114,128,0.12)',
                        color: org.subscriptionPlan === 'enterprise' ? '#7C3AED' : org.subscriptionPlan === 'professional' ? '#2563EB' : '#6B7280',
                      }}>{org.subscriptionPlan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full" style={{
                          background: org.subscriptionStatus === 'active' ? '#10B981' : org.subscriptionStatus === 'trial' ? '#F59E0B' : '#EF4444',
                        }} />
                        <span style={{
                          color: org.subscriptionStatus === 'active' ? '#10B981' : org.subscriptionStatus === 'trial' ? '#F59E0B' : '#EF4444',
                        }}>{org.subscriptionStatus}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        background: org.orgType === 'public' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                        color: org.orgType === 'public' ? '#059669' : '#DC2626',
                      }}>{org.orgType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* Quick Links */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
              <div className="space-y-1.5">
                {quickLinks.map(link => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.href)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left"
                    style={{ background: `${link.color}08`, border: `1px solid ${link.color}15` }}
                  >
                    <link.icon className="w-4 h-4" style={{ color: link.color }} />
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{link.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Plan Distribution</p>
              <div className="space-y-3">
                {[
                  { plan: 'Enterprise', count: planCounts.enterprise, color: '#7C3AED' },
                  { plan: 'Professional', count: planCounts.professional, color: '#2563EB' },
                  { plan: 'Basic', count: planCounts.basic, color: '#6B7280' },
                ].map(p => (
                  <div key={p.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                      <span className="text-sm font-bold" style={{ color: p.color }}>{p.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--overlay-subtle)' }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: organizations.length > 0 ? `${(p.count / organizations.length) * 100}%` : '0%',
                        background: p.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Health */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4" style={{ color: '#10B981' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Platform Health</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Platform', value: 'Operational', dot: '#10B981' },
                  { label: 'Database', value: 'Healthy', dot: '#10B981' },
                  { label: 'Sync Engine', value: 'Running', dot: '#10B981' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: item.dot }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
