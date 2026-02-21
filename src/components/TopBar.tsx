'use client';

import { useState, useRef, useCallback } from 'react';
import { Bell, Search, Moon, Sun, Globe, Shield, Menu } from 'lucide-react';
import { useApp } from '@/lib/context';
import SyncStatus from './SyncStatus';

export default function TopBar({ hideSearch }: { title?: string; hideSearch?: boolean }) {
  const { currentUser, theme, toggleTheme, globalSearch, setGlobalSearch, setSidebarOpen } = useApp();
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setGlobalSearch(value), 300);
  }, [setGlobalSearch]);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isOrgAdmin = currentUser?.role === 'org_admin';
  const isGovernment = currentUser?.role === 'government';

  return (
    <header
      className="h-[52px] flex items-center justify-between px-4 sm:px-5 z-30 mx-3 flex-shrink-0"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger menu - visible on mobile/tablet */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-xl transition-all hover:scale-105"
          style={{
            background: 'var(--overlay-subtle)',
            border: '1px solid var(--border-glass)',
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
                border: '1px solid var(--border-glass)',
                background: 'var(--overlay-subtle)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                transition: 'width 0.3s ease, box-shadow 0.2s ease',
                borderRadius: '14px',
              }}
              onFocus={e => { e.currentTarget.style.width = '340px'; }}
              onBlur={e => { e.currentTarget.style.width = '260px'; }}
            />
          </div>
        )}

        {/* Mobile search button */}
        {!hideSearch && (
          <button
            className="sm:hidden p-2.5 rounded-xl transition-all"
            style={{
              background: 'var(--overlay-subtle)',
              border: '1px solid var(--border-glass)',
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
          className="p-2.5 rounded-xl transition-all hover:scale-105"
          style={{
            background: 'var(--overlay-subtle)',
            border: '1px solid var(--border-glass)',
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
        <button className="relative p-2.5 rounded-xl transition-all hover:scale-105" style={{
          background: 'var(--overlay-subtle)',
          border: '1px solid var(--border-glass)',
        }}>
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{
            background: '#2B6FE0',
            boxShadow: '0 0 6px rgba(43, 111, 224, 0.5)',
          }} />
        </button>

        {/* Super Admin badge */}
        {isSuperAdmin && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}>
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </div>
        )}

        {/* Org Admin badge */}
        {isOrgAdmin && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
            background: 'rgba(43, 111, 224, 0.08)',
            color: '#2B6FE0',
            border: '1px solid rgba(43, 111, 224, 0.15)',
          }}>
            <Globe className="w-3.5 h-3.5" />
            <span>{currentUser?.organization?.name || 'Org Admin'}</span>
          </div>
        )}

        {/* Government badge */}
        {isGovernment && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
            background: 'rgba(43, 111, 224, 0.08)',
            color: '#2B6FE0',
            border: '1px solid rgba(43, 111, 224, 0.15)',
          }}>
            <Globe className="w-3.5 h-3.5" />
            <span>Ministry of Health</span>
          </div>
        )}

        {/* User avatar */}
        {currentUser && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{
            background: isSuperAdmin
              ? 'linear-gradient(135deg, #dc2626, #ef4444)'
              : isGovernment
              ? 'linear-gradient(135deg, #2B6FE0, #1D5BC2)'
              : 'linear-gradient(135deg, #2B6FE0, #1D5BC2)',
            boxShadow: '0 2px 8px rgba(43, 111, 224, 0.25)',
          }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
    </header>
  );
}
