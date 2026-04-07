'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import AssistantChat from '@/components/AssistantChat';
import RoleGuard from '@/components/RoleGuard';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, dbReady, sidebarCollapsed } = useApp();

  useEffect(() => {
    if (dbReady && !isAuthenticated) {
      // Check if the cookie exists before redirecting — prevents a race condition
      // where state hasn't propagated yet but the user just logged in.
      const hasCookie = typeof document !== 'undefined' &&
        document.cookie.split(';').some(c => c.trim().startsWith('taban-token='));
      if (!hasCookie) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, dbReady, router]);

  if (!dbReady || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-mesh-bg">
        <div className="flex flex-col items-center gap-4 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/taban-logo.svg" alt="TABAN" className="w-14 h-14" style={{
            filter: 'drop-shadow(0 4px 12px rgba(10, 61, 107, 0.3))',
          }} />
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading Taban...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar: 240px/72px + 12px left margin = 252px/84px. Content needs matching margin.
  const sidebarMargin = sidebarCollapsed ? '84px' : '252px';

  return (
    <div className="flex h-screen overflow-hidden gradient-mesh-bg">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-300 ease-in-out"
      >
        <style>{`
          @media (min-width: 1024px) {
            .dashboard-content-area { margin-left: ${sidebarMargin}; }
          }
        `}</style>
        <div className="dashboard-content-area flex-1 flex flex-col min-w-0 overflow-hidden pt-3">
          <Breadcrumbs />
          <RoleGuard>{children}</RoleGuard>
        </div>
      </div>
      <AssistantChat />
      <KeyboardShortcuts />
    </div>
  );
}
