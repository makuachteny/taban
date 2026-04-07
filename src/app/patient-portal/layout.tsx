'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';

export default function PatientPortalLayout({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Patient Portal Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-medium)',
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <Link href="/patient-portal" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/taban-icon.svg" alt="Taban" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>TABAN</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 4, background: 'var(--accent-light)' }}>Patient Portal</span>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Desktop nav */}
          <nav className="hidden sm:flex" style={{ gap: 4 }}>
            <Link href="/patient-portal" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 'var(--card-radius)' }}>Home</Link>
            <Link href="/patient-portal#appointments" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>Appointments</Link>
            <Link href="/patient-portal#records" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>Records</Link>
            <Link href="/patient-portal#results" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>Lab Results</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
            <button onClick={() => router.push('/login')} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
              <User size={14} /> <span className="hidden sm:inline">Sign In</span>
            </button>
            <button className="sm:hidden" onClick={() => setMobileNav(!mobileNav)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-secondary)' }}>
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileNav && (
        <div className="sm:hidden" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', padding: '8px 24px 16px' }}>
          {['Home', 'Appointments', 'Records', 'Lab Results'].map(item => (
            <Link key={item} href={`/patient-portal${item === 'Home' ? '' : '#' + item.toLowerCase().replace(' ', '-')}`}
              onClick={() => setMobileNav(false)}
              style={{ display: 'block', padding: '10px 0', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }}>
              {item}
            </Link>
          ))}
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-medium)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Taban Health Technologies &middot; Patient Portal &middot; Your health data is encrypted and secure
        </p>
      </footer>
    </div>
  );
}
