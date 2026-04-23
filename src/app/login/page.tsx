'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2, Users, Wifi, ArrowRight, ChevronRight } from '@/components/icons/lucide';
import { hospitals } from '@/data/mock';
import { useApp } from '@/lib/context';
import { getDefaultDashboard } from '@/lib/permissions';

const BLUE = '#2E9E7E';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser, dbReady } = useApp();
  const [hospitalId, setHospitalId] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredHospitals = hospitals.filter(h =>
    !hospitalSearch || h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.state.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.type.replace(/_/g, ' ').toLowerCase().includes(hospitalSearch.toLowerCase())
  );
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.push(getDefaultDashboard(currentUser.role));
    }
  }, [isAuthenticated, currentUser, router]);

  // Show a redirect spinner while authenticated (instead of blank null)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center" style={{
            background: BLUE,
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(46,158,126,0.25)',
          }}>
            <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password, hospitalId || undefined);
      if (result) {
        router.push(getDefaultDashboard(result));
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
    { role: 'Government', user: 'admin', pass: 'TabanGov#2026!Ss', desc: 'National MoH oversight', color: '#078930', hospital: '' },
    { role: 'Super Admin', user: 'superadmin', pass: 'Super@Taban2026!', desc: 'Platform-wide access', color: '#DC2626', hospital: '' },
    { role: 'Org Admin', user: 'org.admin', pass: 'OrgAdmin@Mercy2026', desc: 'Mercy Hospital Group', color: '#7C3AED', hospital: '' },
    { role: 'Doctor', user: 'dr.wani', pass: 'Dr.Wani@JTH2026', desc: 'Juba Teaching Hospital', color: BLUE, hospital: 'hosp-001' },
    { role: 'Doctor (2)', user: 'dr.achol', pass: 'Dr.Achol@JTH2026', desc: 'Juba Teaching Hospital', color: '#1E4D4A', hospital: 'hosp-001' },
    { role: 'Clinical Officer', user: 'co.deng', pass: 'CO.Deng@WTH2026', desc: 'Wau State Hospital', color: '#0891B2', hospital: 'hosp-002' },
    { role: 'Nurse', user: 'nurse.stella', pass: 'Nurse.Stella@MTH2026', desc: 'Malakal Teaching Hospital', color: '#EC4899', hospital: 'hosp-003' },
    { role: 'Lab Tech', user: 'lab.gatluak', pass: 'Lab.Gat@BSH2026', desc: 'Bentiu State Hospital', color: '#8B5CF6', hospital: 'hosp-004' },
    { role: 'Pharmacist', user: 'pharma.rose', pass: 'Pharma.Rose@JTH2026', desc: 'Juba Teaching Hospital', color: '#E4A84B', hospital: 'hosp-001' },
    { role: 'Front Desk', user: 'desk.amira', pass: 'Desk.Amira@JTH2026', desc: 'Juba Teaching Hospital', color: '#6366F1', hospital: 'hosp-001' },
    { role: 'Doctor (Private)', user: 'dr.mercy', pass: 'Dr.Mercy@2026!', desc: 'Mercy Org · Juba Teaching', color: '#4F46E5', hospital: 'hosp-001' },
    { role: 'Payam Supervisor', user: 'sup.mary', pass: 'Sup.Mary@KJ2026', desc: 'Kajo-keji PHCC', color: '#D97706', hospital: 'phcc-001' },
    { role: 'Boma Health Worker', user: 'bhw.akol', pass: 'BHW.Akol@KJ2026', desc: 'Kajo-keji Boma PHCU', color: '#059669', hospital: 'phcu-001' },
    { role: 'Data Entry Clerk', user: 'data.ayen', pass: 'Data.Ayen@JTH2026', desc: 'Juba Teaching Hospital', color: '#0891B2', hospital: 'hosp-001' },
    { role: 'Med. Superintendent', user: 'supt.lado', pass: 'Supt.Lado@JTH2026', desc: 'Juba Teaching Hospital', color: '#1E40AF', hospital: 'hosp-001' },
    { role: 'Health Records (HRIO)', user: 'hrio.dut', pass: 'HRIO.Dut@JTH2026', desc: 'Juba Teaching Hospital', color: '#0F766E', hospital: 'hosp-001' },
    { role: 'CHV (Community)', user: 'chv.ajak', pass: 'CHV.Ajak@KJ2026', desc: 'Kajo-keji Boma PHCU', color: '#16A34A', hospital: 'phcu-001' },
    { role: 'Nutritionist', user: 'nutr.nyabol', pass: 'Nutr.Nyabol@JTH2026', desc: 'Juba Teaching Hospital', color: '#EA580C', hospital: 'hosp-001' },
    { role: 'Radiologist', user: 'rad.taban', pass: 'Rad.Taban@JTH2026', desc: 'Juba Teaching Hospital', color: '#7C3AED', hospital: 'hosp-001' },
  ];

  const inputLabelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
    letterSpacing: '0',
    textTransform: 'none' as const,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
    color: 'var(--text-primary)',
    background: 'var(--bg-card-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>

      {/* ═══ Centered login form ═══ */}
      <div className="flex flex-col items-center justify-center px-6 py-10 relative">

        {/* Logo (shown on all screens) */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/taban-logo.svg" alt="Taban" className="w-16 h-16" />
          </div>
          <h1 className="text-[24px] font-extrabold" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", letterSpacing: -0.4 }}>Taban</h1>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase mt-1" style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            Republic of South Sudan · Digital Health Records
          </p>
          {/* South Sudan flag stripe */}
          <div className="flex items-center justify-center gap-0 mt-3">
            <div className="h-[3px] w-8 rounded-l-full" style={{ background: '#111' }} />
            <div className="h-[3px] w-8" style={{ background: '#E52E42' }} />
            <div className="h-[3px] w-4" style={{ background: '#fff', border: '0.5px solid var(--border-medium)' }} />
            <div className="h-[3px] w-8" style={{ background: '#10B944' }} />
            <div className="h-[3px] w-4" style={{ background: '#0F4C81' }} />
            <div className="h-[3px] w-2 rounded-r-full" style={{ background: '#FCD34D' }} />
          </div>
        </div>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="p-8 sm:p-10" style={{
            background: 'var(--bg-card-solid)',
            borderRadius: '6px',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>Staff Sign In</h2>
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>Access the national health record system</p>

            {!dbReady && (
              <div className="mb-4 p-3 rounded-lg text-center" style={{
                background: 'rgba(46,158,126,0.08)',
                border: '1px solid rgba(46,158,126,0.15)',
              }}>
                <p className="text-xs" style={{ color: BLUE }}>
                  <svg className="animate-spin w-3 h-3 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Initializing offline database...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div style={{ position: 'relative' }}>
                <label htmlFor="login-hospital" style={inputLabelStyle}>Hospital / Facility</label>
                <input
                  id="login-hospital"
                  type="text"
                  value={hospitalSearch}
                  onChange={(e) => { setHospitalSearch(e.target.value); setShowHospitalDropdown(true); setHospitalId(''); }}
                  onFocus={() => setShowHospitalDropdown(true)}
                  placeholder="Search by hospital name, state, or type..."
                  autoComplete="off"
                  style={inputStyle}
                />
                {hospitalId && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={12} /> {hospitals.find(h => h.id === hospitalId)?.name || hospitalId}
                  </div>
                )}
                {showHospitalDropdown && hospitalSearch.length > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4,
                    background: 'var(--bg-card-solid)', border: '1px solid var(--border-medium)',
                    borderRadius: 8, boxShadow: 'var(--card-shadow-lg)', zIndex: 50,
                    maxHeight: 200, overflowY: 'auto',
                  }}>
                    {filteredHospitals.length === 0 ? (
                      <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>No facilities found</p>
                    ) : (
                      filteredHospitals.slice(0, 10).map(h => {
                        const typeLabel = h.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => { setHospitalId(h.id); setHospitalSearch(h.name); setShowHospitalDropdown(false); }}
                            style={{
                              width: '100%', padding: '8px 14px', border: 'none', cursor: 'pointer',
                              background: hospitalId === h.id ? 'var(--accent-light)' : 'transparent',
                              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = hospitalId === h.id ? 'var(--accent-light)' : 'transparent'}
                          >
                            <Building2 size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{typeLabel} — {h.state}</div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="login-username" style={inputLabelStyle}>Username or Staff ID</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr.wani or JTH-1234"
                  autoComplete="username"
                  className="login-input"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="login-password" style={inputLabelStyle}>Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="login-input"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    style={{ color: '#8A9E9A' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="p-3 rounded-xl text-sm" style={{
                  background: 'rgba(229,46,66,0.06)',
                  color: '#E52E42',
                  border: '1px solid rgba(229,46,66,0.15)',
                }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !dbReady}
                className="w-full flex items-center justify-center gap-2 text-[15px] font-semibold text-white transition-all duration-200 mt-3"
                style={{
                  fontFamily: "'Inter', 'DM Sans', sans-serif",
                  background: BLUE,
                  padding: '13px 24px',
                  borderRadius: '4px',
                  border: `2px solid ${BLUE}`,
                  boxShadow: '0 2px 8px rgba(0,119,215,0.25)',
                  opacity: !dbReady ? 0.5 : undefined,
                }}
                onMouseEnter={(e) => { if (dbReady && !loading) { e.currentTarget.style.background = '#1E4D4A'; e.currentTarget.style.borderColor = '#1E4D4A'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Staff Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts — hidden in production */}
          {process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between px-5 py-3 transition-colors"
              style={{
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-medium)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>Demo Accounts</span>
              <ChevronRight
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: showDemoAccounts ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>

            {showDemoAccounts && (
              <div className="mt-2 overflow-hidden" style={{
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                boxShadow: 'var(--card-shadow-lg)',
              }}>
                {demoAccounts.map((acc, i) => (
                  <button
                    key={acc.user}
                    type="button"
                    onClick={() => { setUsername(acc.user); setPassword(acc.pass); setHospitalId(acc.hospital || 'hosp-001'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                    style={{
                      borderBottom: i < demoAccounts.length - 1 ? '1px solid var(--border-medium)' : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card-solid)'}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: acc.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{acc.role}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{acc.desc}</span>
                      </div>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {acc.user} &middot; {acc.pass}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Footer stats */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-5 mb-3">
              {[
                { value: '87+', label: 'Facilities', icon: Building2 },
                { value: '11.4M', label: 'Citizens', icon: Users },
                { value: '24/7', label: 'Offline Ready', icon: Wifi },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <stat.icon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>{stat.value}</span>
                  <span className="text-[9px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{
                background: 'var(--overlay-subtle)',
                border: '1px solid var(--border-medium)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/ssrp.svg" alt="South Sudan" className="w-5 h-5 object-contain" />
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{
                background: 'var(--overlay-subtle)',
                border: '1px solid var(--border-medium)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/moh.jpg" alt="Ministry of Health" className="w-5 h-5 object-contain rounded-sm" />
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border-medium)' }} />
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/taban-icon.svg" alt="Taban" className="w-8 h-8" />
              </div>
            </div>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              Republic of South Sudan · Ministry of Health · v2.0
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-input:focus,
        .login-select:focus {
          border-color: ${BLUE};
          box-shadow: 0 0 0 3px rgba(46,158,126,0.1);
        }
        .login-input::placeholder {
          color: var(--text-muted);
        }
        select option {
          background: var(--bg-card-solid);
          color: var(--text-primary);
        }
        select optgroup {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
