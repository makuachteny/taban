'use client';

import { useState, useRef, useCallback } from 'react';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useApp } from '@/lib/context';
import { getRoleConfig } from '@/lib/permissions';
import SyncStatus from './SyncStatus';

export default function TopBar({ hideSearch }: { title?: string; hideSearch?: boolean }) {
  const { currentUser, theme, toggleTheme, globalSearch, setGlobalSearch, setSidebarOpen } = useApp();
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const roleConfig = currentUser ? getRoleConfig(currentUser.role) : null;

  const handleSearch = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setGlobalSearch(value), 300);
  }, [setGlobalSearch]);

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
          className="lg:hidden p-2 -ml-1 rounded-md transition-all hover:scale-105"
          style={{
            background: 'var(--overlay-subtle)',
            border: '1px solid var(--border-medium)',
          }}
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
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
            className="sm:hidden p-2.5 rounded-md transition-all"
            style={{
              background: 'var(--overlay-subtle)',
              border: '1px solid var(--border-medium)',
            }}
            onClick={() => {
              const val = prompt('Search patients, records...');
              if (val !== null) handleSearch(val);
            }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-md transition-all hover:scale-105"
          style={{
            background: 'var(--overlay-subtle)',
            border: '1px solid var(--border-medium)',
          }}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
          )}
        </button>

        {/* Sync Status */}
        <div className="hidden sm:block">
          <SyncStatus />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-md transition-all hover:scale-105" style={{
          background: 'var(--overlay-subtle)',
          border: '1px solid var(--border-medium)',
        }}>
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{
            background: '#0077D7',
            boxShadow: '0 0 6px rgba(43, 111, 224, 0.5)',
          }} />
        </button>

        {/* Role badge */}
        {roleConfig && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold" style={{
            background: `${roleConfig.color}12`,
            color: roleConfig.color,
            border: `1px solid ${roleConfig.color}20`,
          }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: roleConfig.color }} />
            <span>{roleConfig.badgeLabel}</span>
          </div>
        )}

        {/* User avatar */}
        {currentUser && (
          <div className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{
            background: `linear-gradient(135deg, ${roleConfig?.gradientFrom || '#0077D7'}, ${roleConfig?.gradientTo || '#005FBC'})`,
            boxShadow: `0 2px 8px ${roleConfig?.color || '#0077D7'}30`,
          }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
    </header>
  );
}
