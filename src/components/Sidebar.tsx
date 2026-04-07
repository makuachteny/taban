'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut, Globe, Building2, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useApp } from '@/lib/context';
import { getRoleConfig } from '@/lib/permissions';
import type { NavItem } from '@/lib/permissions';

function groupBySection(items: NavItem[]): { section: string | null; items: NavItem[] }[] {
  const groups: { section: string | null; items: NavItem[] }[] = [];
  let current: { section: string | null; items: NavItem[] } | null = null;

  for (const item of items) {
    const sec = item.section || null;
    if (!current || current.section !== sec) {
      current = { section: sec, items: [item] };
      groups.push(current);
    } else {
      current.items.push(item);
    }
  }
  return groups;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, currentUser, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useApp();

  const role = currentUser?.role;
  const isAdminLevel = role === 'super_admin' || role === 'org_admin' || role === 'government';
  const roleConfig = currentUser ? getRoleConfig(currentUser.role) : null;
  const navItems = roleConfig?.navItems || [];
  const groups = groupBySection(navItems);
  const hasSections = navItems.some(i => i.section);

  const branding = currentUser?.branding;
  const brandName = role === 'super_admin' ? 'TABAN' : (branding?.name || 'TABAN');
  const brandLogo = branding?.logoUrl;
  const subtitle = roleConfig?.label || 'Digital Health Records';

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const collapsed = sidebarCollapsed;

  // Drag-to-collapse/expand
  const dragRef = useRef<{ startX: number; startWidth: number; dragging: boolean }>({ startX: 0, startWidth: 240, dragging: false });
  const sidebarRef = useRef<HTMLElement>(null);

  const handleDragStart = useCallback((clientX: number) => {
    dragRef.current = {
      startX: clientX,
      startWidth: collapsed ? 72 : 240,
      dragging: true,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [collapsed]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragRef.current.dragging) return;
    const delta = clientX - dragRef.current.startX;
    const newWidth = dragRef.current.startWidth + delta;
    // Threshold: if dragged below 140px, collapse; above 140px, expand
    if (sidebarRef.current) {
      sidebarRef.current.style.transition = 'none';
      sidebarRef.current.style.width = `${Math.max(56, Math.min(260, newWidth))}px`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (sidebarRef.current) {
      const currentWidth = sidebarRef.current.getBoundingClientRect().width;
      sidebarRef.current.style.transition = '';
      if (currentWidth < 140) {
        setSidebarCollapsed(true);
        sidebarRef.current.style.width = '';
      } else {
        setSidebarCollapsed(false);
        sidebarRef.current.style.width = '';
      }
    }
  }, [setSidebarCollapsed]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientX);
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
    const onTouchMove = (ev: TouchEvent) => handleDragMove(ev.touches[0].clientX);
    const onTouchEnd = () => {
      handleDragEnd();
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`pt-5 pb-3 ${collapsed ? 'px-2' : 'px-5'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogo} alt={brandName} className="w-9 h-9 rounded-2xl flex-shrink-0 object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/taban-icon.svg" alt={brandName} className="w-9 h-9 rounded-2xl flex-shrink-0 object-contain" style={{
              boxShadow: '0 2px 8px rgba(10, 61, 107, 0.3)',
            }} />
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-[15px] leading-tight tracking-wide" style={{ color: 'var(--text-primary)' }}>
                {brandName.length > 12 ? brandName.slice(0, 12) : brandName}
              </h1>
              <p className="text-[9px] uppercase tracking-[0.18em] font-semibold" style={{ color: roleConfig?.color || '#0077D7' }}>
                {subtitle}
              </p>
            </div>
          )}
          {/* Close button - only on mobile/tablet */}
          {!collapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--overlay-subtle)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Role & facility badge */}
      {currentUser && !collapsed && (
        <div className="mx-4 mb-3 p-3 rounded-2xl" style={{
          background: 'var(--overlay-subtle)',
          border: '1px solid var(--border-medium)',
        }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{
              background: `${roleConfig?.color || '#0077D7'}18`,
            }}>
              {isAdminLevel
                ? <Globe className="w-3.5 h-3.5" style={{ color: roleConfig?.color || 'var(--text-muted)' }} />
                : <Building2 className="w-3.5 h-3.5" style={{ color: roleConfig?.color || 'var(--text-muted)' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {isAdminLevel ? roleConfig?.label : 'Current Facility'}
                </p>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                  background: `${roleConfig?.color || '#0077D7'}15`,
                  color: roleConfig?.color || '#0077D7',
                }}>{roleConfig?.badgeLabel}</span>
              </div>
              <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {role === 'super_admin' ? 'All Organizations'
                  : role === 'government' ? 'Republic of South Sudan'
                  : role === 'org_admin' ? (currentUser.organization?.name || 'My Organization')
                  : (currentUser.hospital?.name || currentUser.hospitalName || 'Unassigned')}
              </p>
              {!isAdminLevel && currentUser.hospital?.state && (
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{currentUser.hospital.state}</p>
              )}
            </div>
          </div>
          {!isAdminLevel && currentUser.organization && (
            <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-medium)' }}>
              <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: roleConfig?.color || '#0077D7' }} />
              <p className="text-[9px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>{currentUser.organization.name}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 mt-1 overflow-y-auto overflow-x-hidden no-scrollbar ${collapsed ? 'px-2' : 'px-3'}`}>
        {hasSections ? (
          groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.section && !collapsed && (
                <p className="px-3 pt-1 pb-2 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  {group.section}
                </p>
              )}
              {group.section && collapsed && (
                <div className="w-6 h-px mx-auto my-2" style={{ background: 'var(--border-medium)' }} />
              )}
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      title={collapsed ? item.label : undefined}
                      className={`nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
                    >
                      <item.icon className="w-[17px] h-[17px] flex-shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
                      {!collapsed && <span className="font-medium text-[13px]">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  title={collapsed ? item.label : undefined}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
                >
                  <item.icon className="w-[17px] h-[17px] flex-shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
                  {!collapsed && <span className="font-medium text-[13px]">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className={`pb-2 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="hidden lg:flex nav-item w-full text-left items-center"
          style={{ color: 'var(--nav-text)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="w-[17px] h-[17px] mx-auto" />
          ) : (
            <>
              <ChevronsLeft className="w-[17px] h-[17px]" />
              <span className="text-[13px]">Collapse</span>
            </>
          )}
        </button>

        {roleConfig?.allowedRoutes?.includes('/settings') && (
          <Link
            href="/settings"
            onClick={handleNavClick}
            title={collapsed ? 'Settings' : undefined}
            className={`nav-item ${pathname === '/settings' ? 'nav-item-active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
          >
            <Settings className="w-[17px] h-[17px]" style={{ opacity: pathname === '/settings' ? 1 : 0.6 }} />
            {!collapsed && <span className="font-medium text-[13px]">Settings</span>}
          </Link>
        )}

        <button
          onClick={() => { setSidebarOpen(false); logout(); }}
          className={`nav-item w-full text-left ${collapsed ? 'justify-center !px-0' : ''}`}
          style={{ color: 'var(--nav-text)' }}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-[17px] h-[17px]" />
          {!collapsed && <span className="text-[13px]">Sign Out</span>}
        </button>
      </div>

      {/* User profile card */}
      {currentUser && !collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-2xl" style={{
          background: 'var(--overlay-subtle)',
          border: '1px solid var(--border-medium)',
        }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{
              background: `linear-gradient(135deg, ${roleConfig?.gradientFrom || '#0077D7'}, ${roleConfig?.gradientTo || '#005FBC'})`,
              boxShadow: `0 2px 8px ${roleConfig?.color || '#0077D7'}40`,
            }}>
              {(currentUser.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{currentUser.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{roleConfig?.badgeLabel || currentUser.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed user avatar */}
      {currentUser && collapsed && (
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{
            background: `linear-gradient(135deg, ${roleConfig?.gradientFrom || '#0077D7'}, ${roleConfig?.gradientTo || '#005FBC'})`,
            boxShadow: `0 2px 8px ${roleConfig?.color || '#0077D7'}40`,
          }}
          title={currentUser.name}
          >
            {(currentUser.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar — floating glass panel */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col z-40 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? '72px' : '240px',
          margin: '12px',
          marginRight: '0',
          height: 'calc(100vh - 24px)',
          background: 'var(--sidebar-bg)',
          backdropFilter: `blur(var(--sidebar-blur))`,
          WebkitBackdropFilter: `blur(var(--sidebar-blur))`,
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        {sidebarContent}
        {/* Drag handle on right edge */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 group"
          style={{ borderRadius: '0 10px 10px 0' }}
        >
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: roleConfig?.color || '#0077D7' }}
          />
        </div>
      </aside>

      {/* Mobile/Tablet drawer backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 backdrop-blur-sm"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile/Tablet drawer — always expanded */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 flex flex-col z-50 overflow-hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: '280px',
          margin: '8px',
          height: 'calc(100vh - 16px)',
          background: 'var(--sidebar-bg)',
          backdropFilter: `blur(var(--sidebar-blur))`,
          WebkitBackdropFilter: `blur(var(--sidebar-blur))`,
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          boxShadow: sidebarOpen ? 'var(--card-shadow-xl)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
