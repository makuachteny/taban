'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import AssistantChat from '@/components/AssistantChat';
import RoleGuard from '@/components/RoleGuard';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, dbReady, sidebarCollapsed } = useApp();

  useEffect(() => {
    if (dbReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, dbReady, router]);

  if (!dbReady || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-mesh-bg">
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #2B6FE0, #1D5BC2)',
            boxShadow: '0 4px 16px rgba(43, 111, 224, 0.3)',
          }}>
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading Taban...</p>
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
          <RoleGuard>{children}</RoleGuard>
        </div>
      </div>
      <AssistantChat />
    </div>
  );
}
