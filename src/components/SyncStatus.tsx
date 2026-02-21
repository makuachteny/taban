'use client';

import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';
import type { AggregateState } from '@/lib/sync/sync-manager';

const STATE_CONFIG: Record<AggregateState, {
  icon: typeof Wifi;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  disabled: {
    icon: CloudOff,
    label: 'Local Only',
    color: 'var(--text-muted)',
    bg: 'var(--overlay-subtle)',
    border: 'var(--border-light)',
    glow: 'none',
  },
  idle: {
    icon: Wifi,
    label: 'Connected',
    color: '#4ADE80',
    bg: 'rgba(43,111,224,0.1)',
    border: 'rgba(43,111,224,0.2)',
    glow: '0 0 12px rgba(43,111,224,0.1)',
  },
  syncing: {
    icon: Loader2,
    label: 'Syncing',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.2)',
    glow: '0 0 12px rgba(96,165,250,0.1)',
  },
  synced: {
    icon: CheckCircle2,
    label: 'Synced',
    color: '#4ADE80',
    bg: 'rgba(43,111,224,0.1)',
    border: 'rgba(43,111,224,0.2)',
    glow: '0 0 12px rgba(43,111,224,0.1)',
  },
  error: {
    icon: AlertCircle,
    label: 'Sync Error',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.2)',
    glow: '0 0 12px rgba(248,113,113,0.1)',
  },
  offline: {
    icon: WifiOff,
    label: 'Offline',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.1)',
    border: 'rgba(252,211,77,0.2)',
    glow: '0 0 12px rgba(252,211,77,0.1)',
  },
};

function formatSyncTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function SyncStatus() {
  const { isOnline, lastSync, syncStatus, syncNow, toggleOnline } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Determine the effective state
  const syncState: AggregateState = syncStatus
    ? syncStatus.state
    : (isOnline ? 'disabled' : 'offline');

  const config = STATE_CONFIG[syncState];
  const Icon = config.icon;

  const handleSyncNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClick = () => {
    // If sync is enabled, toggle details panel; otherwise fall back to toggleOnline
    if (syncStatus && syncStatus.state !== 'disabled') {
      setShowDetails(prev => !prev);
    } else {
      toggleOnline();
    }
  };

  return (
    <div className="relative">
      {/* Main status button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
        style={{
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          boxShadow: config.glow,
        }}
      >
        <Icon className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {syncState !== 'offline' && syncState !== 'disabled' && lastSync && (
          <span style={{ opacity: 0.6 }}>· {formatSyncTime(lastSync)}</span>
        )}
        {syncState === 'offline' && (
          <RefreshCw className="w-3 h-3 sync-pulse" />
        )}
      </button>

      {/* Details dropdown */}
      {showDetails && syncStatus && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-lg z-50 p-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: 'var(--card-shadow-lg)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sync Status
            </span>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || syncState === 'offline'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'rgba(96,165,250,0.1)',
                color: '#60A5FA',
                border: '1px solid rgba(96,165,250,0.2)',
                opacity: isSyncing || syncState === 'offline' ? 0.5 : 1,
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-2" style={{ background: 'var(--overlay-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Docs Sent</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{syncStatus.totalDocsWritten}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'var(--overlay-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Docs Received</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{syncStatus.totalDocsRead}</div>
            </div>
          </div>

          {/* Per-database status */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {Object.entries(syncStatus.databases).map(([name, dbStatus]) => {
              const shortName = name.replace('taban_', '');
              const stateColor = dbStatus.state === 'active' ? '#4ADE80'
                : dbStatus.state === 'error' ? '#F87171'
                : dbStatus.state === 'paused' ? '#60A5FA'
                : 'var(--text-muted)';
              return (
                <div key={name} className="flex items-center justify-between py-1 px-2 rounded" style={{
                  background: 'var(--overlay-subtle)',
                }}>
                  <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)', maxWidth: '120px' }}>
                    {shortName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: stateColor }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {dbStatus.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {syncStatus.errorDatabases > 0 && (
            <div className="mt-2 text-[11px] px-2 py-1.5 rounded-lg" style={{
              background: 'rgba(248,113,113,0.1)',
              color: '#F87171',
            }}>
              {syncStatus.errorDatabases} database(s) have sync errors
            </div>
          )}
        </div>
      )}
    </div>
  );
}
