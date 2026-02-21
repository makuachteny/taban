'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Building2, Users, Wifi, ArrowRight, ChevronRight } from 'lucide-react';
import { hospitals } from '@/data/mock';
import { useApp } from '@/lib/context';
import { getDefaultDashboard } from '@/lib/permissions';
import type { UserRole } from '@/lib/db-types';

const BLUE = '#2B6FE0';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser, dbReady } = useApp();
  const [hospitalId, setHospitalId] = useState('hosp-001');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Checking DB...');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    if (!dbReady) {
      setDebugInfo('DB not ready yet...');
      return;
    }
    (async () => {
      try {
        const { usersDB } = await import('@/lib/db');
        const db = usersDB();
        const allDocs = await db.allDocs();
        setDebugInfo(`DB ready. Users found: ${allDocs.total_rows}`);
      } catch (err: unknown) {
        setDebugInfo(`DB error: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  }, [dbReady]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.push(getDefaultDashboard(currentUser.role));
    }
  }, [isAuthenticated, currentUser, router]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { usersDB } = await import('@/lib/db');
      const { verifyPassword } = await import('@/lib/auth');
      const db = usersDB();
      const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      try {
        const user = await db.get(`user-${sanitized}`) as { passwordHash: string; isActive: boolean; role: string; hospitalId?: string };
        const pwMatch = await verifyPassword(password, user.passwordHash);
        setDebugInfo(`User: ${sanitized} | Active: ${user.isActive} | PW match: ${pwMatch} | Role: ${user.role} | Hospital: ${user.hospitalId || 'none'} | Selected: ${hospitalId}`);
      } catch {
        setDebugInfo(`User "user-${sanitized}" not found in DB`);
      }

      const result = await login(username, password, hospitalId);
      if (result) {
        router.push(getDefaultDashboard(result as UserRole));
      } else {
        setError('Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Super Admin', user: 'superadmin', pass: 'Super@Taban2026!', desc: 'Platform-wide access', color: '#DC2626' },
    { role: 'Org Admin', user: 'org.admin', pass: 'OrgAdmin@Mercy2026', desc: 'Mercy Hospital Group', color: '#7C3AED' },
    { role: 'Doctor', user: 'dr.wani', pass: 'Dr.Wani@JTH2026', desc: 'Clinical access', color: BLUE },
    { role: 'Government', user: 'admin', pass: 'TabanGov#2026!Ss', desc: 'Government oversight', color: '#2B6FE0' },
    { role: 'Boma Health Worker', user: 'bhw.akol', pass: 'BHW.Akol@KJ2026', desc: 'Kajo-keji Boma PHCU', color: '#059669' },
    { role: 'Payam Supervisor', user: 'sup.mary', pass: 'Sup.Mary@KJ2026', desc: 'Kajo-keji PHCC', color: '#D97706' },
  ];

  const inputLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: BLUE,
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    fontSize: '14px',
    color: '#1e293b',
    background: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid #e2e8f0',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>

      {/* ═══ Centered login form ═══ */}
      <div className="flex flex-col items-center justify-center px-6 py-10 relative">

        {/* Mobile logo (shown on small screens) */}
        <div className="lg:hidden text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{
              background: BLUE,
              boxShadow: '0 4px 20px rgba(43,111,224,0.35)',
            }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-[20px] font-extrabold tracking-[0.15em]" style={{ color: '#1e293b' }}>TABAN</h1>
          <p className="text-[9px] font-medium tracking-[0.25em] uppercase mt-1" style={{ color: '#94a3b8' }}>
            Digital Health Records
          </p>
        </div>

        {/* Form card */}
        <div style={{ width: '420px', maxWidth: '100%' }}>
          <div className="rounded-3xl p-8 sm:p-10" style={{
            background: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#1e293b' }}>Sign In</h2>
            <p className="text-sm mb-7" style={{ color: '#94a3b8' }}>Access the national health record system</p>

            {/* Debug info */}
            <div className="mb-4 p-2 rounded-lg text-center" style={{
              background: 'rgba(252,211,77,0.08)',
              border: '1px solid rgba(252,211,77,0.15)',
            }}>
              <p className="text-[10px] font-mono" style={{ color: '#D97706' }}>{debugInfo}</p>
            </div>

            {!dbReady && (
              <div className="mb-4 p-3 rounded-lg text-center" style={{
                background: 'rgba(43,111,224,0.08)',
                border: '1px solid rgba(43,111,224,0.15)',
              }}>
                <p className="text-xs" style={{ color: BLUE }}>
                  <svg className="animate-spin w-3 h-3 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Initializing offline database...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label style={inputLabelStyle}>Hospital Facility</label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="login-select"
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    paddingRight: '24px',
                  }}
                >
                  <optgroup label="Hospitals">
                    {hospitals.filter(h => h.type === 'national_referral' || h.type === 'state_hospital' || h.type === 'county_hospital').map(h => (
                      <option key={h.id} value={h.id}>{h.name} — {h.state}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Primary Health Care Centres (PHCC)">
                    {hospitals.filter(h => h.type === 'phcc').map(h => (
                      <option key={h.id} value={h.id}>{h.name} — {h.state}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Primary Health Care Units (PHCU)">
                    {hospitals.filter(h => h.type === 'phcu').map(h => (
                      <option key={h.id} value={h.id}>{h.name} — {h.state}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={inputLabelStyle}>Username or Staff ID</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr.wani or JTH-1234"
                  className="login-input"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={inputLabelStyle}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="login-input"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors"
                    style={{ color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl text-sm" style={{
                  background: 'rgba(229,46,66,0.06)',
                  color: '#E52E42',
                  border: '1px solid rgba(229,46,66,0.15)',
                }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !dbReady}
                className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-white transition-all duration-200 mt-3"
                style={{
                  background: `linear-gradient(135deg, ${BLUE}, #1d5bc4)`,
                  padding: '14px 24px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 16px rgba(43,111,224,0.3)',
                  opacity: !dbReady ? 0.5 : undefined,
                }}
                onMouseEnter={(e) => { if (dbReady && !loading) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(43,111,224,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(43,111,224,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between px-5 py-3 rounded-xl transition-colors"
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">Demo Accounts</span>
              <ChevronRight
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: showDemoAccounts ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>

            {showDemoAccounts && (
              <div className="mt-2 rounded-2xl overflow-hidden" style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}>
                {demoAccounts.map((acc, i) => (
                  <button
                    key={acc.user}
                    type="button"
                    onClick={() => { setUsername(acc.user); setPassword(acc.pass); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                    style={{
                      borderBottom: i < demoAccounts.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: acc.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold" style={{ color: '#1e293b' }}>{acc.role}</span>
                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{acc.desc}</span>
                      </div>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: '#b0bec5' }}>
                        {acc.user} &middot; {acc.pass}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#cbd5e1' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-5 mb-3">
              {[
                { value: '87+', label: 'Facilities', icon: Building2 },
                { value: '11.4M', label: 'Citizens', icon: Users },
                { value: '24/7', label: 'Offline Ready', icon: Wifi },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <stat.icon className="w-3 h-3" style={{ color: '#94a3b8' }} />
                  <span className="text-[12px] font-bold" style={{ color: '#475569' }}>{stat.value}</span>
                  <span className="text-[9px] uppercase tracking-[0.06em]" style={{ color: '#94a3b8' }}>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden" style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/ssrp.svg" alt="South Sudan" className="w-4 h-4 object-contain" />
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden" style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/moh.jpg" alt="Ministry of Health" className="w-4 h-4 object-contain rounded-sm" />
              </div>
              <div className="w-px h-5" style={{ background: '#e2e8f0' }} />
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-[9px]" style={{ color: '#94a3b8' }}>
              Republic of South Sudan · Ministry of Health · v2.0
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-input:focus,
        .login-select:focus {
          border-bottom-color: ${BLUE};
        }
        .login-input::placeholder {
          color: #cbd5e1;
        }
        select option {
          background: white;
          color: #1e293b;
        }
        select optgroup {
          background: #f8fafc;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
