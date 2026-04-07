'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import {
  Settings, Mail, CreditCard, Building2,
  CheckCircle, XCircle, Zap, Lock, Info,
} from 'lucide-react';
import type { OrganizationDoc } from '@/lib/db-types';

export default function OrgSettingsPage() {
  const { currentUser } = useApp();
  const [org, setOrg] = useState<OrganizationDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const brandColor = currentUser?.branding?.primaryColor || '#7C3AED';

  useEffect(() => {
    if (!currentUser?.orgId) return;
    const load = async () => {
      try {
        const { getOrganizationById } = await import('@/lib/services/organization-service');
        const o = await getOrganizationById(currentUser.orgId!);
        if (o) setOrg(o);
      } catch (err) {
        console.error('Failed to load org settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.orgId]);

  const planLabels: Record<string, string> = {
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  const statusColors: Record<string, string> = {
    active: '#0077D7',
    trial: '#F59E0B',
    suspended: '#E52E42',
    cancelled: '#6B7280',
  };

  const featureFlags = org?.featureFlags ? [
    { key: 'epidemicIntelligence', label: 'Epidemic Intelligence', desc: 'Outbreak detection and surveillance analytics' },
    { key: 'mchAnalytics', label: 'MCH Analytics', desc: 'Maternal and child health tracking' },
    { key: 'dhis2Export', label: 'DHIS2 Export', desc: 'Export data to DHIS2 national reporting' },
    { key: 'aiClinicalSupport', label: 'AI Clinical Support', desc: 'AI-assisted diagnosis and treatment suggestions' },
    { key: 'communityHealth', label: 'Community Health', desc: 'Boma health worker and community outreach' },
    { key: 'facilityAssessments', label: 'Facility Assessments', desc: 'Health facility readiness scoring' },
  ] : [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Organization Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: brandColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Organization Settings" />

      <div className="page-container page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${brandColor}15` }}>
            <Settings className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Organization Settings</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>View your organization configuration (read-only)</p>
          </div>
        </div>

        {/* Read-only notice */}
        <div className="mb-6 p-3 rounded-lg flex items-center gap-2" style={{ background: `${brandColor}08`, border: `1px solid ${brandColor}20` }}>
          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: brandColor }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Organization settings are managed by the platform super admin. Contact support to request changes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Info */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5" style={{ color: brandColor }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Organization Info</h2>
            </div>

            <div className="space-y-3">
              <InfoRow label="Name" value={org?.name || '-'} />
              <InfoRow label="Slug" value={org?.slug || '-'} mono />
              <InfoRow label="Type" value={org?.orgType === 'public' ? 'Public Sector' : 'Private Sector'} />
              <InfoRow label="Country" value={org?.country || '-'} />
              <InfoRow label="Contact Email" value={org?.contactEmail || '-'} icon={<Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />} />
              <InfoRow
                label="Status"
                value={org?.isActive ? 'Active' : 'Inactive'}
                badge
                badgeColor={org?.isActive ? '#0077D7' : '#E52E42'}
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" style={{ color: '#F59E0B' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Subscription</h2>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Plan"
                value={planLabels[org?.subscriptionPlan || ''] || '-'}
                badge
                badgeColor={brandColor}
              />
              <InfoRow
                label="Status"
                value={org?.subscriptionStatus || '-'}
                badge
                badgeColor={statusColors[org?.subscriptionStatus || ''] || '#6B7280'}
              />
              <InfoRow label="Max Users" value={String(org?.maxUsers || '-')} />
              <InfoRow label="Max Hospitals" value={String(org?.maxHospitals || '-')} />
              <InfoRow
                label="Created"
                value={org?.createdAt ? new Date(org.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              />
              <InfoRow
                label="Last Updated"
                value={org?.updatedAt ? new Date(org.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              />
            </div>
          </div>

          {/* Feature Flags */}
          <div className="lg:col-span-2 p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: '#F59E0B' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Feature Flags</h2>
              <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: 'var(--overlay-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                Read-only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featureFlags.map((flag) => {
                const enabled = org?.featureFlags?.[flag.key as keyof typeof org.featureFlags] || false;
                return (
                  <div
                    key={flag.key}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{
                      background: enabled ? 'rgba(43,111,224,0.05)' : 'var(--overlay-subtle)',
                      border: `1px solid ${enabled ? 'rgba(43,111,224,0.15)' : 'var(--border-light)'}`,
                    }}
                  >
                    <div className="pt-0.5">
                      {enabled ? (
                        <CheckCircle className="w-5 h-5" style={{ color: '#0077D7' }} />
                      ) : (
                        <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {flag.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {flag.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

              {featureFlags.length === 0 && (
                <div className="col-span-full py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No feature flags available.
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Feature flags determine which modules are available for your organization. To enable or disable features,
                contact the platform administrator or upgrade your subscription plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for read-only info rows
function InfoRow({
  label,
  value,
  mono,
  icon,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
  badge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {icon}
        {badge ? (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
            style={{
              background: `${badgeColor}15`,
              color: badgeColor,
            }}
          >
            {value}
          </span>
        ) : (
          <span
            className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
