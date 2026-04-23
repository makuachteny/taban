'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { HospitalDoc, OrganizationDoc, UserRole, UserDoc } from './db-types';
import type { OrgBranding } from './branding';
import type { AggregateStatus } from './sync/sync-manager';
// Eagerly bundle the critical login path. These modules are tiny and used at
// the most user-facing flow — lazy-loading them via dynamic import() created
// a separate webpack chunk that could 404 if the browser tab outlived a dev
// rebuild ("Loading chunk _app-pages-browser_src_lib_auth_ts-*.js failed").
import { usersDB } from './db';
import { verifyPassword } from './auth';
import { createToken } from './auth-token';
import { logAudit } from './services/audit-service';

/** True when an error came from a failed dynamic-chunk fetch (stale tab after
 *  a hot-reload, network blip, etc.). The recovery for these is always a
 *  full page reload. */
function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /ChunkLoadError|Loading chunk .*failed|Failed to fetch dynamically imported module/i.test(msg);
}

export type Theme = 'light' | 'dark';

interface AppUser {
  _id: string;
  username: string;
  name: string;
  role: UserRole;
  hospitalId?: string;
  hospitalName?: string;
  hospital?: HospitalDoc;
  orgId?: string;
  organization?: OrganizationDoc;
  branding: OrgBranding;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  isOnline: boolean;
  lastSync: string;
  theme: Theme;
  dbReady: boolean;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  login: (username: string, password: string, hospitalId?: string) => Promise<UserRole | false>;
  logout: () => void;
  toggleOnline: () => void;
  toggleTheme: () => void;
  /** Sync state from the SyncManager (null when sync is disabled) */
  syncStatus: AggregateStatus | null;
  /** Trigger a one-shot sync across all databases */
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  const [dbReady, setDbReady] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AggregateStatus | null>(null);
  const syncManagerRef = useRef<import('./sync/sync-manager').SyncManager | null>(null);

  // Initialize database and check session
  useEffect(() => {
    const init = async () => {
      // Seed database on first load (client-side only)
      // In production, seeding only runs if DB is empty (isSeeded check inside seedDatabase)
      try {
        const { seedDatabase } = await import('./db-seed');
        await seedDatabase();
      } catch (err) {
        console.error('[Taban] Database seed error:', err);
      }
      setDbReady(true);

      // Check for existing session via cookie (skip API call if no cookie)
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('taban-token='));
      if (hasCookie) {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              // Load hospital data if user has a hospitalId
              let hospital: HospitalDoc | undefined;
              if (data.user.hospitalId) {
                try {
                  const { getHospitalById } = await import('./services/hospital-service');
                  const h = await getHospitalById(data.user.hospitalId);
                  if (h) hospital = h;
                } catch {
                  // OK
                }
              }

              // Load organization data
              let organization: OrganizationDoc | undefined;
              if (data.user.orgId) {
                try {
                  const { getOrganizationById } = await import('./services/organization-service');
                  const org = await getOrganizationById(data.user.orgId);
                  if (org) organization = org;
                } catch {
                  // OK
                }
              }

              const { getOrgBranding, brandingToCSSVars } = await import('./branding');
              const branding = getOrgBranding(organization);
              const vars = brandingToCSSVars(branding);
              for (const [key, value] of Object.entries(vars)) {
                document.documentElement.style.setProperty(key, value);
              }

              // Apply org language setting
              if (organization?.locale) {
                const { initLocaleFromOrg } = await import('./i18n/useTranslation');
                initLocaleFromOrg(organization.locale);
              }

              setCurrentUser({ ...data.user, hospital, organization, branding });
              setIsAuthenticated(true);
            }
          }
        } catch {
          // Offline - OK
        }
      }
    };

    init();

    // Theme — default to light
    const saved = localStorage.getItem('taban-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date().toISOString());
      if (syncManagerRef.current) {
        syncManagerRef.current.syncNow().catch(() => {});
      }
      // Notify service worker to flush sync queue
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage('ONLINE');
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Sync lifecycle: start on login, stop on logout ---
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Tear down sync when logged out
      if (syncManagerRef.current) {
        import('./sync/sync-manager').then(({ destroySyncManager }) => {
          destroySyncManager();
          syncManagerRef.current = null;
          setSyncStatus(null);
        });
      }
      return;
    }

    // Start sync if enabled
    import('./sync/sync-manager').then(({ createSyncManager }) => {
      const manager = createSyncManager({
        orgId: currentUser.orgId,
        onChange: (status) => {
          setSyncStatus(status);
          // Update lastSync from real data
          if (status.lastSync) {
            setLastSync(status.lastSync);
          }
        },
      });
      syncManagerRef.current = manager;
      manager.startAll();
      setSyncStatus(manager.getStatus());
    });

    return () => {
      import('./sync/sync-manager').then(({ destroySyncManager }) => {
        destroySyncManager();
        syncManagerRef.current = null;
      });
    };
  }, [isAuthenticated, currentUser?.orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncNow = useCallback(async () => {
    if (syncManagerRef.current) {
      await syncManagerRef.current.syncNow();
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('taban-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const login = useCallback(async (username: string, password: string, hospitalId?: string): Promise<UserRole | false> => {
    try {
      // Auth happens client-side where PouchDB data lives.
      // usersDB / verifyPassword / createToken / logAudit are imported eagerly
      // at the top of this file so they can never produce a chunk-load error.
      const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const db = usersDB();

      let user: UserDoc;
      try {
        user = await db.get(`user-${sanitizedUsername}`) as UserDoc;
      } catch {
        await logAudit('login_failed', undefined, sanitizedUsername, 'User not found', false);
        return false;
      }

      if (!user.isActive) {
        await logAudit('login_failed', user._id, sanitizedUsername, 'Account disabled', false);
        return false;
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        await logAudit('login_failed', user._id, sanitizedUsername, 'Invalid password', false);
        return false;
      }

      // Check hospital assignment for non-admin users
      const ROLES_WITHOUT_HOSPITAL = ['super_admin', 'org_admin', 'government'];
      if (!ROLES_WITHOUT_HOSPITAL.includes(user.role) && hospitalId && user.hospitalId && user.hospitalId !== hospitalId) {
        await logAudit('login_failed', user._id, sanitizedUsername, `Hospital mismatch`, false);
        return false;
      }

      // Create JWT and set as cookie
      const token = await createToken({
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        hospitalId: user.hospitalId,
        orgId: user.orgId,
      });

      // Set cookie (accessible to middleware for route protection)
      document.cookie = `taban-token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax${window.location.protocol === 'https:' ? '; secure' : ''}`;

      await logAudit('login_success', user._id, user.username, `Login successful`, true);

      // Load hospital data
      let hospital: HospitalDoc | undefined;
      if (user.hospitalId) {
        try {
          const { getHospitalById } = await import('./services/hospital-service');
          const h = await getHospitalById(user.hospitalId);
          if (h) hospital = h;
        } catch {
          // OK
        }
      }

      // Load organization data and branding
      let organization: OrganizationDoc | undefined;
      if (user.orgId) {
        try {
          const { getOrganizationById } = await import('./services/organization-service');
          const org = await getOrganizationById(user.orgId);
          if (org) organization = org;
        } catch {
          // OK
        }
      }

      const { getOrgBranding, brandingToCSSVars } = await import('./branding');
      const branding = getOrgBranding(organization);

      // Apply branding CSS variables
      const vars = brandingToCSSVars(branding);
      for (const [key, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(key, value);
      }

      // Apply org language setting
      if (organization?.locale) {
        const { initLocaleFromOrg } = await import('./i18n/useTranslation');
        initLocaleFromOrg(organization.locale);
      }

      setCurrentUser({
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role as UserRole,
        hospitalId: user.hospitalId,
        hospitalName: user.hospitalName,
        hospital,
        orgId: user.orgId,
        organization,
        branding,
      });
      setIsAuthenticated(true);
      return user.role as UserRole;
    } catch (err) {
      console.error('Login error:', err);
      // Expose the real error for debugging (remove in production)
      (window as unknown as Record<string, unknown>).__lastLoginError = err instanceof Error ? err.message : String(err);

      // Stale-chunk recovery: this happens when a long-lived browser tab tries
      // to lazy-load a JS chunk that the dev server already rebuilt under a
      // new hash. The fix is always a hard reload — offer it directly.
      if (isChunkLoadError(err)) {
        const reload = confirm(
          'A code update was detected and one of the page resources is out of date. ' +
          'Click OK to reload the page and try again.'
        );
        if (reload) window.location.reload();
        return false;
      }

      alert(`Login internal error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear the cookie client-side
    document.cookie = 'taban-token=; path=/; max-age=0; samesite=lax';
    try {
      const { logAudit } = await import('./services/audit-service');
      await logAudit('logout', currentUser?._id, currentUser?.username, 'Logged out', true);
    } catch {
      // OK
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, [currentUser]);

  const toggleOnline = () => {
    setIsOnline(prev => {
      if (!prev) setLastSync(new Date().toISOString());
      return !prev;
    });
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, currentUser, isOnline, lastSync, theme, dbReady,
      globalSearch, setGlobalSearch,
      sidebarOpen, setSidebarOpen,
      sidebarCollapsed, setSidebarCollapsed,
      login, logout, toggleOnline, toggleTheme,
      syncStatus, syncNow,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
