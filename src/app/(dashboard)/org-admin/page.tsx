'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import {
  Users, Building2, UserCheck, CreditCard, Shield,
  TrendingUp, CheckCircle, XCircle, Zap, BarChart3,
} from 'lucide-react';
import type { OrganizationDoc } from '@/lib/db-types';

interface OrgStats {
  userCount: number;
  hospitalCount: number;
  patientCount: number;
}

export default function OrgAdminDashboard() {
  const { currentUser } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState<OrgStats>({ userCount: 0, hospitalCount: 0, patientCount: 0 });
  const [org, setOrg] = useState<OrganizationDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const brandColor = currentUser?.branding?.primaryColor || '#7C3AED';

  useEffect(() => {
    if (!currentUser?.orgId) return;
    const load = async () => {
      try {
        const { getOrganizationStats } = await import('@/lib/services/organization-service');
        const { getOrganizationById } = await import('@/lib/services/organization-service');
        const [s, o] = await Promise.all([
          getOrganizationStats(currentUser.orgId!),
          getOrganizationById(currentUser.orgId!),
        ]);
        setStats(s);
        if (o) setOrg(o);
      } catch (err) {
        console.error('Failed to load org stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.orgId]);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.userCount,
      icon: Users,
      color: brandColor,
      bgOpacity: '15',
    },
    {
      label: 'Hospitals',
      value: stats.hospitalCount,
      icon: Building2,
      color: '#2B6FE0',
      bgOpacity: '15',
    },
    {
      label: 'Patients',
      value: stats.patientCount,
      icon: UserCheck,
      color: '#2B6FE0',
      bgOpacity: '15',
    },
    {
      label: 'Subscription',
      value: org?.subscriptionStatus === 'active' ? 'Active' : org?.subscriptionStatus || 'N/A',
      icon: CreditCard,
      color: org?.subscriptionStatus === 'active' ? '#2B6FE0' : '#F59E0B',
      bgOpacity: '15',
    },
  ];

  const featureFlags = org?.featureFlags ? [
    { key: 'epidemicIntelligence', label: 'Epidemic Intelligence', enabled: org.featureFlags.epidemicIntelligence },
    { key: 'mchAnalytics', label: 'MCH Analytics', enabled: org.featureFlags.mchAnalytics },
    { key: 'dhis2Export', label: 'DHIS2 Export', enabled: org.featureFlags.dhis2Export },
    { key: 'aiClinicalSupport', label: 'AI Clinical Support', enabled: org.featureFlags.aiClinicalSupport },
    { key: 'communityHealth', label: 'Community Health', enabled: org.featureFlags.communityHealth },
    { key: 'facilityAssessments', label: 'Facility Assessments', enabled: org.featureFlags.facilityAssessments },
  ] : [];

  const planLabels: Record<string, string> = {
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Organization Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: brandColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Organization Dashboard" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 page-enter">
        {/* Org Header */}
        <div className="mb-6 flex items-center gap-4">
          {currentUser?.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.branding.logoUrl}
              alt={currentUser.branding.name}
              className="w-12 h-12 rounded-lg object-cover"
              style={{ border: `2px solid ${brandColor}` }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
            >
              {(org?.name || 'O')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {org?.name || currentUser?.branding?.name || 'Organization'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {org?.orgType === 'public' ? 'Public Sector' : 'Private Sector'} Organization
            </p>
          </div>
          {org?.subscriptionPlan && (
            <div
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                background: `${brandColor}18`,
                color: brandColor,
                border: `1px solid ${brandColor}30`,
              }}
            >
              {planLabels[org.subscriptionPlan] || org.subscriptionPlan} Plan
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="p-5 rounded-xl cursor-pointer"
                onClick={() => {
                  const routes: Record<string, string> = { 'Total Users': '/org-admin/users', 'Hospitals': '/org-admin/hospitals', 'Patients': '/patients', 'Subscription': '/org-admin/settings' };
                  if (routes[card.label]) router.push(routes[card.label]);
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${card.color}${card.bgOpacity}` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {card.label}
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Plan & Limits + Feature Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Details */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" style={{ color: brandColor }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Subscription Details
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Plan</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {planLabels[org?.subscriptionPlan || ''] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: org?.subscriptionStatus === 'active' ? 'rgba(43,111,224,0.12)' : 'rgba(245,158,11,0.12)',
                    color: org?.subscriptionStatus === 'active' ? '#2B6FE0' : '#F59E0B',
                  }}
                >
                  {org?.subscriptionStatus || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Max Users</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {stats.userCount} / {org?.maxUsers || '---'}
                  </span>
                  {org?.maxUsers && stats.userCount >= org.maxUsers && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>
                      Limit reached
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Max Hospitals</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {stats.hospitalCount} / {org?.maxHospitals || '---'}
                  </span>
                  {org?.maxHospitals && stats.hospitalCount >= org.maxHospitals && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.12)', color: '#E52E42' }}>
                      Limit reached
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Organization Type</span>
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                  {org?.orgType || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: '#F59E0B' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Enabled Features
              </h2>
            </div>

            <div className="space-y-3">
              {featureFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {flag.label}
                  </span>
                  {flag.enabled ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" style={{ color: '#2B6FE0' }} />
                      <span className="text-xs font-medium" style={{ color: '#2B6FE0' }}>Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Disabled</span>
                    </div>
                  )}
                </div>
              ))}

              {featureFlags.length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No feature flags configured.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" style={{ color: brandColor }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: '/org-admin/users', label: 'Manage Users', icon: Users, desc: 'Create, edit, or deactivate users' },
              { href: '/org-admin/hospitals', label: 'Manage Facilities', icon: Building2, desc: 'View and add hospitals' },
              { href: '/org-admin/branding', label: 'Customize Branding', icon: TrendingUp, desc: 'Colors, logo, and identity' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-lg transition-all hover:scale-[1.01]"
                  style={{
                    background: 'var(--overlay-subtle)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${brandColor}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
