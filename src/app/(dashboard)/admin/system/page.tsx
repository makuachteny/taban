'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useApp } from '@/lib/context';
import { usePlatformConfig } from '@/lib/hooks/usePlatformConfig';
import {
  Settings, Save, Database, ToggleLeft, ToggleRight,
  Shield, AlertTriangle, Server, HardDrive
} from 'lucide-react';

interface DBStats {
  name: string;
  docCount: number;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { config, loading, update } = usePlatformConfig();

  const [platformName, setPlatformName] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [trialDays, setTrialDays] = useState(30);
  const [maxOrganizations, setMaxOrganizations] = useState(100);
  const [defaultPrimaryColor, setDefaultPrimaryColor] = useState('#2B6FE0');
  const [defaultSecondaryColor, setDefaultSecondaryColor] = useState('#0F47AF');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbStats, setDbStats] = useState<DBStats[]>([]);
  const [dbStatsLoading, setDbStatsLoading] = useState(true);

  // Access control
  useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Populate form from config
  useEffect(() => {
    if (config) {
      setPlatformName(config.platformName);
      setMaintenanceMode(config.maintenanceMode);
      setSignupsEnabled(config.globalFeatureFlags.signupsEnabled);
      setTrialDays(config.globalFeatureFlags.trialDays);
      setMaxOrganizations(config.globalFeatureFlags.maxOrganizations);
      setDefaultPrimaryColor(config.defaultPrimaryColor);
      setDefaultSecondaryColor(config.defaultSecondaryColor);
    }
  }, [config]);

  // Load DB stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getDB } = await import('@/lib/db');
        const dbNames = [
          { key: 'taban_users', label: 'Users' },
          { key: 'taban_patients', label: 'Patients' },
          { key: 'taban_hospitals', label: 'Hospitals' },
          { key: 'taban_medical_records', label: 'Medical Records' },
          { key: 'taban_referrals', label: 'Referrals' },
          { key: 'taban_lab_results', label: 'Lab Results' },
          { key: 'taban_disease_alerts', label: 'Disease Alerts' },
          { key: 'taban_prescriptions', label: 'Prescriptions' },
          { key: 'taban_audit_log', label: 'Audit Log' },
          { key: 'taban_messages', label: 'Messages' },
          { key: 'taban_births', label: 'Births' },
          { key: 'taban_deaths', label: 'Deaths' },
          { key: 'taban_immunizations', label: 'Immunizations' },
          { key: 'taban_anc', label: 'ANC Visits' },
          { key: 'taban_boma_visits', label: 'Boma Visits' },
          { key: 'taban_follow_ups', label: 'Follow-Ups' },
          { key: 'taban_organizations', label: 'Organizations' },
          { key: 'taban_platform_config', label: 'Platform Config' },
        ];
        const stats: DBStats[] = [];
        for (const { key, label } of dbNames) {
          try {
            const db = getDB(key);
            const info = await db.info();
            stats.push({ name: label, docCount: info.doc_count });
          } catch {
            stats.push({ name: label, docCount: 0 });
          }
        }
        setDbStats(stats);
      } catch (err) {
        console.error('Failed to load DB stats:', err);
      } finally {
        setDbStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (!currentUser || currentUser.role !== 'super_admin') return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await update({
        platformName,
        maintenanceMode,
        globalFeatureFlags: {
          signupsEnabled,
          trialDays,
          maxOrganizations,
        },
        defaultPrimaryColor,
        defaultSecondaryColor,
      }, currentUser._id, currentUser.username);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)',
    borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
    fontSize: '14px', width: '100%', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  };

  const totalDocs = dbStats.reduce((sum, s) => sum + s.docCount, 0);

  return (
    <>
      <TopBar title="System Configuration" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">

        <div className="grid grid-cols-3 gap-6">

          {/* Left: Configuration Form */}
          <div className="col-span-2 space-y-6">

            {/* Platform Settings */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Settings className="w-5 h-5" style={{ color: '#7C3AED' }} />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Platform Settings</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Configure global platform parameters</p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>Loading configuration...</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label style={labelStyle}>Platform Name</label>
                    <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)} style={inputStyle} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Default Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={defaultPrimaryColor} onChange={e => setDefaultPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <input type="text" value={defaultPrimaryColor} onChange={e => setDefaultPrimaryColor(e.target.value)}
                          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Default Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={defaultSecondaryColor} onChange={e => setDefaultSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <input type="text" value={defaultSecondaryColor} onChange={e => setDefaultSecondaryColor(e.target.value)}
                          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
                  <Shield className="w-5 h-5" style={{ color: '#DC2626' }} />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Feature Toggles</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enable or disable global features</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{
                  background: maintenanceMode ? 'rgba(239,68,68,0.05)' : 'var(--overlay-subtle)',
                  border: `1px solid ${maintenanceMode ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`,
                }}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" style={{ color: maintenanceMode ? '#EF4444' : 'var(--text-muted)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Maintenance Mode</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>When enabled, only super admins can access the platform</p>
                    </div>
                  </div>
                  <button onClick={() => setMaintenanceMode(!maintenanceMode)}>
                    {maintenanceMode ? (
                      <ToggleRight className="w-10 h-10" style={{ color: '#EF4444' }} />
                    ) : (
                      <ToggleLeft className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                </div>

                {/* Signups Enabled */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Signups Enabled</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Allow new organization registrations</p>
                  </div>
                  <button onClick={() => setSignupsEnabled(!signupsEnabled)}>
                    {signupsEnabled ? (
                      <ToggleRight className="w-10 h-10" style={{ color: '#059669' }} />
                    ) : (
                      <ToggleLeft className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                </div>

                {/* Trial Days & Max Orgs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Trial Days</label>
                    <input type="number" min="1" max="365" value={trialDays} onChange={e => setTrialDays(parseInt(e.target.value) || 30)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Organizations</label>
                    <input type="number" min="1" value={maxOrganizations} onChange={e => setMaxOrganizations(parseInt(e.target.value) || 100)} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: '#7C3AED', opacity: saving ? 0.6 : 1 }}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              {saved && (
                <span className="text-sm font-medium" style={{ color: '#059669' }}>Configuration saved successfully</span>
              )}
            </div>
          </div>

          {/* Right: DB Statistics */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4" style={{ color: '#7C3AED' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Database Statistics</span>
              </div>

              {/* Total docs */}
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-4 h-4" style={{ color: '#7C3AED' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Documents</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#7C3AED' }}>{dbStatsLoading ? '...' : totalDocs.toLocaleString()}</p>
              </div>

              {/* Per-DB */}
              <div className="space-y-1">
                {dbStatsLoading ? (
                  <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading stats...</p>
                ) : (
                  dbStats.map(db => (
                    <div key={db.name} className="flex items-center justify-between py-2 px-2 rounded-lg transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <div className="flex items-center gap-2">
                        <Server className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{db.name}</span>
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color: db.docCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {db.docCount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>System Info</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Storage Engine', value: 'PouchDB (IndexedDB)' },
                  { label: 'Platform', value: 'Next.js 14' },
                  { label: 'UI Framework', value: 'Tailwind CSS' },
                  { label: 'Auth', value: 'JWT (Client-side)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
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
