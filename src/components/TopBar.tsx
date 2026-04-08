'use client';

import { useState, useRef, useCallback } from 'react';
import { Bell, Search, Moon, Sun, Menu, Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useApp } from '@/lib/context';
import { getRoleConfig } from '@/lib/permissions';

export default function TopBar({ hideSearch }: { title?: string; hideSearch?: boolean }) {
  const { currentUser, theme, toggleTheme, globalSearch, setGlobalSearch, setSidebarOpen, isOnline, syncStatus, toggleOnline, syncNow } = useApp();
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const roleConfig = currentUser ? getRoleConfig(currentUser.role) : null;

  const handleSearch = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setGlobalSearch(value), 300);
  }, [setGlobalSearch]);

  // Determine sync icon and label
  const syncState = syncStatus?.state || (isOnline ? 'disabled' : 'offline');
  const SyncIcon = syncState === 'offline' ? WifiOff : syncState === 'disabled' ? CloudOff : Wifi;
  const syncLabel = syncState === 'offline' ? 'Offline' : syncState === 'disabled' ? 'Local Only' : syncState === 'syncing' ? 'Syncing' : syncState === 'error' ? 'Sync Error' : 'Online';
  const syncColor = syncState === 'offline' ? 'var(--color-warning)' : syncState === 'error' ? 'var(--color-danger)' : syncState === 'syncing' ? 'var(--accent-primary)' : syncState === 'disabled' ? 'var(--text-muted)' : 'var(--color-success)';

  // Shared icon-button style
  const iconBtn = "w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative";

  return (
    <header
      className="h-[52px] flex items-center justify-between px-4 sm:px-5 z-30 mx-3 flex-shrink-0"
      style={{
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger menu - visible on mobile/tablet */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className={`lg:hidden ${iconBtn} -ml-1`}
          style={{ background: 'var(--overlay-subtle)' }}
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>

        {/* Search */}
        {!hideSearch && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              placeholder="Search by name, ID, or record..."
              value={localSearch}
              onChange={e => handleSearch(e.target.value)}
              className="search-icon-input pr-4 py-2.5 text-sm"
              style={{
                width: '260px',
                border: '1px solid var(--border-medium)',
                background: 'var(--overlay-subtle)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                transition: 'width 0.3s ease, box-shadow 0.2s ease',
                borderRadius: 'var(--input-radius)',
              }}
              onFocus={e => { e.currentTarget.style.width = '340px'; }}
              onBlur={e => { e.currentTarget.style.width = '260px'; }}
            />
          </div>
        )}

        {/* Mobile search button */}
        {!hideSearch && (
          <button
            aria-label="Search patients and records"
            className={`sm:hidden ${iconBtn}`}
            style={{ background: 'var(--overlay-subtle)' }}
            onClick={() => {
              const val = prompt('Search patients, records...');
              if (val !== null) handleSearch(val);
            }}
          >
            <Search className="w-[18px] h-[18px]" style={{ color: 'var(--text-primary)' }} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className={iconBtn}
          style={{ background: 'transparent' }}
        >
          {theme === 'light' ? (
            <Moon className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Sun className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        {/* Sync Status */}
        <button
          onClick={() => {
            if (syncStatus && syncStatus.state !== 'disabled') {
              syncNow();
            } else {
              toggleOnline();
            }
          }}
          aria-label={syncLabel}
          title={syncLabel}
          className={`hidden sm:flex ${iconBtn}`}
          style={{ background: 'transparent' }}
        >
          <SyncIcon className={`w-[18px] h-[18px] ${syncState === 'syncing' ? 'animate-pulse' : ''}`} style={{ color: syncColor }} />
          {/* Status dot */}
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" aria-hidden="true" style={{
            background: syncColor,
            boxShadow: `0 0 4px ${syncColor}`,
          }} />
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className={`relative ${iconBtn}`}
          style={{ background: 'transparent' }}
        >
          <Bell className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" aria-hidden="true" style={{
            background: 'var(--accent-primary)',
            boxShadow: '0 0 4px var(--accent-light)',
          }} />
        </button>

        {/* Role badge */}
        {roleConfig && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{
            background: 'var(--accent-light)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-border)',
          }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" aria-hidden="true" style={{ background: roleConfig.color }} />
            <span>{currentUser?.organization?.name || roleConfig.badgeLabel}</span>
          </div>
        )}

        {/* User avatar */}
        {currentUser && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{
            background: 'var(--accent-primary)',
          }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
    </header>
  );
}
