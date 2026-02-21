'use client';

import Link from 'next/link';
import { Shield, ArrowRight, Building2, Users, Wifi, Activity, HeartPulse, Syringe, BarChart3, FileText, Heart, MapPin, Database, Globe, ChevronRight, Menu, X, Zap, Lock, Layers, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const NAVY = '#0f172a';
const BLUE = '#2B6FE0';
const BLUE_HOVER = '#1D5BC2';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
      }}>
        <div className="site-row h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BLUE }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[16px] font-extrabold tracking-[0.08em] font-display" style={{ color: NAVY }}>
              TABAN
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Platform', 'Impact', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-[13.5px] font-medium transition-colors duration-200"
                style={{ color: '#5A6B7F' }}
                onMouseEnter={(e) => e.currentTarget.style.color = NAVY}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5A6B7F'}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[13.5px] font-semibold px-5 py-2.5 rounded-full transition-colors duration-200"
              style={{ color: NAVY }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Sign In
            </Link>
            <Link href="/login" className="text-[13.5px] font-semibold px-6 py-2.5 rounded-full text-white flex items-center gap-2 transition-all duration-200"
              style={{ background: BLUE, boxShadow: '0 2px 12px rgba(43,111,224,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_HOVER; e.currentTarget.style.boxShadow = '0 4px 20px rgba(43,111,224,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.boxShadow = '0 2px 12px rgba(43,111,224,0.3)'; }}
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: NAVY }}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-5" style={{ background: 'rgba(255,255,255,0.98)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="site-row space-y-1 pt-3">
              {['Features', 'Platform', 'Impact', 'About'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  className="block py-3 text-[15px] font-medium"
                  style={{ color: '#5A6B7F' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="pt-3">
                <Link href="/login" className="block w-full text-center text-[15px] font-semibold py-3 rounded-full text-white"
                  style={{ background: BLUE }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EDF2FC 40%, #E0EAFC 100%)',
      }}>
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(43,111,224,0.04) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }} />
        {/* Warm glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(43,111,224,0.08) 0%, transparent 70%)',
          transform: 'translate(20%, -30%)',
        }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(13,148,136,0.05) 0%, transparent 70%)',
          transform: 'translate(-20%, 30%)',
        }} />

        <div className="site-row relative" style={{ paddingTop: '140px', paddingBottom: '60px' }}>
          {/* Badge */}
          <div className="flex justify-center mb-7">
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full" style={{
              background: 'rgba(43,111,224,0.08)',
              border: '1px solid rgba(43,111,224,0.15)',
            }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: BLUE }} />
              <span className="text-[12px] font-semibold tracking-[0.04em]" style={{ color: BLUE }}>
                South Sudan&apos;s National Health Records Platform
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center font-display font-extrabold leading-[1.06]" style={{
            color: NAVY,
            letterSpacing: '-0.035em',
            fontSize: 'clamp(32px, 5.5vw, 64px)',
          }}>
            Transforming Healthcare
            <br />
            Delivery Across{' '}
            <span className="relative inline-block">
              South Sudan
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" style={{ height: '8px' }}>
                <path d="M2 8 C60 2, 120 2, 150 6 C180 10, 240 4, 298 6" stroke={BLUE} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center max-w-[600px] mx-auto mt-6 leading-[1.75] text-[15px] sm:text-[17px]" style={{
            color: '#5A6B7F',
          }}>
            An offline-first, patient-focused electronic health records platform connecting
            facilities from national level down to every boma health worker.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/login" className="flex items-center justify-center gap-2.5 text-[15px] font-semibold text-white rounded-full transition-all duration-200 w-full sm:w-auto"
              style={{
                background: BLUE,
                padding: '14px 36px',
                boxShadow: '0 4px 24px rgba(43,111,224,0.35)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_HOVER; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(43,111,224,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(43,111,224,0.35)'; }}
            >
              Access Platform <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="flex items-center justify-center gap-2 text-[15px] font-semibold rounded-full transition-all duration-200 w-full sm:w-auto"
              style={{
                color: NAVY,
                padding: '14px 32px',
                border: '1.5px solid rgba(26,39,68,0.15)',
                background: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.15)'; }}
            >
              Explore Features
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12">
            {[
              { value: '87+', label: 'Facilities' },
              { value: '11.4M', label: 'Citizens' },
              { value: '10', label: 'States' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[18px] sm:text-[20px] font-extrabold font-display" style={{ color: NAVY, letterSpacing: '-0.02em' }}>{s.value}</span>
                <span className="text-[12px] font-medium" style={{ color: '#8B9BB5' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="site-row-wide pb-12">
          <div className="w-full rounded-2xl overflow-hidden" style={{
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 30px 90px rgba(26,39,68,0.1), 0 8px 30px rgba(26,39,68,0.06)',
            background: 'linear-gradient(135deg, #dde8f7 0%, #dde8f0 25%, #e4e0f0 50%, #d4e4f0 75%, #e0eef7 100%)',
          }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.7)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-[300px] mx-auto px-4 py-1.5 rounded-full text-[10px] font-mono text-center" style={{
                  background: 'rgba(255,255,255,0.6)',
                  color: '#8B9BB5',
                }}>
                  taban.health.gov.ss/dashboard
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Glassmorphism Sidebar */}
              <div className="hidden md:block w-[180px] lg:w-[200px] p-3 flex-shrink-0" style={{
                background: 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(16px)',
                borderRight: '1px solid rgba(255,255,255,0.5)',
              }}>
                <div className="flex items-center gap-2 mb-5 px-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BLUE}, #1D5BC2)` }}>
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider" style={{ color: NAVY }}>TABAN</span>
                </div>
                {['Dashboard', 'Patients', 'Lab Results', 'Pharmacy', 'Immunizations', 'Consultation', 'Settings'].map((item, i) => (
                  <div key={item} className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[10px] mb-0.5" style={{
                    background: i === 0 ? BLUE : 'transparent',
                    color: i === 0 ? '#FFFFFF' : '#6B7C93',
                    fontWeight: i === 0 ? 600 : 400,
                    boxShadow: i === 0 ? '0 2px 8px rgba(43,111,224,0.3)' : 'none',
                  }}>
                    <div className="w-3.5 h-3.5 rounded" style={{ background: i === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.05)' }} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-3 sm:p-4 lg:p-5">
                {/* TopBar mockup */}
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-2xl" style={{
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                }}>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl text-[9px]" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', color: '#8B9BB5' }}>
                      Search by name, ID, or record...
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }} />
                    <div className="w-6 h-6 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }} />
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[7px] font-bold text-white" style={{
                      background: `linear-gradient(135deg, ${BLUE}, #1D5BC2)`,
                    }}>
                      DW
                    </div>
                  </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-4">
                  {/* Total Admitted Patients */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <p className="text-[7px] sm:text-[8px] font-medium mb-1" style={{ color: '#8B9BB5' }}>Total Admitted Patients</p>
                    <div className="flex items-end gap-1 mb-1.5">
                      <p className="text-[16px] sm:text-[18px] font-bold font-display" style={{ color: NAVY, letterSpacing: '-0.02em' }}>1,630</p>
                      <span className="text-[7px] font-semibold mb-0.5 flex items-center gap-0.5" style={{ color: BLUE }}>
                        <TrendingUp className="w-2 h-2" /> 2%
                      </span>
                    </div>
                    <div className="flex gap-2 text-[7px]">
                      <span style={{ color: '#60A5FA' }}>897 M</span>
                      <span style={{ color: '#EC4899' }}>733 F</span>
                    </div>
                    <div className="border-t mt-1.5 pt-1.5 grid grid-cols-3 gap-1" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                      <div className="text-center">
                        <p className="text-[9px] font-bold" style={{ color: NAVY }}>196</p>
                        <p className="text-[6px]" style={{ color: '#8B9BB5' }}>Waiting</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold" style={{ color: NAVY }}>245</p>
                        <p className="text-[6px]" style={{ color: '#8B9BB5' }}>Discharge</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold" style={{ color: NAVY }}>33</p>
                        <p className="text-[6px]" style={{ color: '#8B9BB5' }}>Transfer</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Active Staff */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <p className="text-[7px] sm:text-[8px] font-medium mb-1" style={{ color: '#8B9BB5' }}>Total Active Staff</p>
                    <p className="text-[16px] sm:text-[18px] font-bold font-display mb-2" style={{ color: NAVY, letterSpacing: '-0.02em' }}>42</p>
                    <div className="space-y-1.5 mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px]" style={{ color: '#6B7C93' }}>Doctors</span>
                        <span className="text-[8px] font-bold" style={{ color: NAVY }}>12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px]" style={{ color: '#6B7C93' }}>Nursing</span>
                        <span className="text-[8px] font-bold" style={{ color: NAVY }}>30</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Overview */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <p className="text-[7px] sm:text-[8px] font-medium mb-2" style={{ color: '#8B9BB5' }}>Quick Overview</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Pending Referrals', val: '7', c: '#F59E0B' },
                        { label: 'Active Alerts', val: '3', c: '#E52E42' },
                        { label: 'Immunizations', val: '284', c: '#A855F7' },
                        { label: 'ANC / Births', val: '52 / 18', c: '#EC4899' },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                          <span className="text-[7px]" style={{ color: '#6B7C93' }}>{r.label}</span>
                          <span className="text-[8px] font-bold" style={{ color: r.c }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patient Satisfaction */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <div className="flex gap-2 mb-1.5 border-b pb-1" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                      {['Satisfaction', 'Equipment', 'Dept'].map((tab, i) => (
                        <span key={tab} className="text-[6px] font-semibold uppercase" style={{
                          color: i === 0 ? BLUE : '#8B9BB5',
                          borderBottom: i === 0 ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                          paddingBottom: '2px',
                        }}>{tab}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mini donut */}
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#3ECF8E" strokeWidth="5" strokeDasharray="61.3 113" strokeDashoffset="-28" />
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#60A5FA" strokeWidth="5" strokeDasharray="26 113" strokeDashoffset="-89.3" />
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#FCD34D" strokeWidth="5" strokeDasharray="22.6 113" strokeDashoffset="0" />
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#F87171" strokeWidth="5" strokeDasharray="3.4 113" strokeDashoffset="-22.6" />
                      </svg>
                      <div className="space-y-0.5">
                        {[
                          { name: 'Excellent', pct: '54%', c: '#3ECF8E' },
                          { name: 'Good', pct: '23%', c: '#60A5FA' },
                          { name: 'Average', pct: '20%', c: '#FCD34D' },
                          { name: 'Poor', pct: '3%', c: '#F87171' },
                        ].map(d => (
                          <div key={d.name} className="flex items-center gap-1 text-[6px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.c }} />
                            <span style={{ color: '#6B7C93' }}>{d.name}</span>
                            <span className="font-bold ml-auto" style={{ color: NAVY }}>{d.pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1.5 p-1 rounded-lg text-center" style={{ background: 'rgba(43,111,224,0.08)', border: '1px solid rgba(43,111,224,0.15)' }}>
                      <span className="text-[6px]" style={{ color: '#8B9BB5' }}>Satisfaction Rate</span>
                      <span className="text-[11px] font-bold ml-1" style={{ color: BLUE }}>76%</span>
                    </div>
                  </div>
                </div>

                {/* Recently Admitted Patients Table */}
                <div className="rounded-2xl mb-4 overflow-hidden" style={{
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                }}>
                  <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <p className="text-[9px] font-semibold" style={{ color: NAVY }}>Recently Admitted Patients</p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[7px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E52E42' }} />
                        <span style={{ color: '#8B9BB5' }}>Critical</span>
                      </span>
                      <span className="text-[7px] font-medium" style={{ color: BLUE }}>Details &rsaquo;</span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead>
                        <tr>
                          {['Patient Name', 'Patient ID', 'Ward-Room', 'Doctor', 'Nurse', 'Division'].map(h => (
                            <th key={h} className="text-left px-3 py-1.5 text-[7px] font-semibold uppercase tracking-wider" style={{ color: '#8B9BB5', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Wani James', age: '34 Y, M', id: 'JTH-0001', ward: 'OPD-7', doc: 'Dr. Akol Deng', nurse: 'Nurse Ayen', div: 'OPD', critical: true },
                          { name: 'Achol Mabior', age: '28 Y, F', id: 'JTH-0002', ward: 'Emergency-3', doc: 'Dr. Ladu Morris', nurse: 'Nurse Nyamal', div: 'Emergency', critical: false },
                          { name: 'Taban Philip', age: '45 Y, M', id: 'JTH-0003', ward: 'Maternity-12', doc: 'Dr. Achol Mabior', nurse: 'Nurse Rose', div: 'Maternity', critical: false },
                        ].map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <td className="px-3 py-1.5">
                              <span className="text-[8px] font-medium" style={{ color: NAVY }}>{p.name}</span>
                              <span className="text-[7px] ml-1" style={{ color: '#8B9BB5' }}>{p.age}</span>
                            </td>
                            <td className="px-3 py-1.5 text-[8px] font-mono" style={{ color: '#6B7C93' }}>{p.id}</td>
                            <td className="px-3 py-1.5 text-[8px]" style={{ color: '#6B7C93' }}>{p.ward}</td>
                            <td className="px-3 py-1.5 text-[8px]" style={{ color: '#6B7C93' }}>{p.doc}</td>
                            <td className="px-3 py-1.5 text-[8px]" style={{ color: '#6B7C93' }}>{p.nurse}</td>
                            <td className="px-3 py-1.5">
                              {p.critical ? (
                                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(229,46,66,0.1)', color: '#E52E42' }}>{p.div}</span>
                              ) : (
                                <span className="text-[8px]" style={{ color: '#6B7C93' }}>{p.div}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile table placeholder */}
                  <div className="sm:hidden px-3 py-2 space-y-1">
                    {['Wani James — OPD-7', 'Achol Mabior — Emergency-3', 'Taban Philip — Maternity-12'].map(p => (
                      <div key={p} className="text-[8px] py-1" style={{ color: '#6B7C93', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{p}</div>
                    ))}
                  </div>
                </div>

                {/* Bottom Charts Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {/* Disease Distribution */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[8px] font-semibold" style={{ color: NAVY }}>Disease Distribution</p>
                      <span className="text-[7px] font-medium" style={{ color: BLUE }}>Details &rsaquo;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="52" height="52" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="20" fill="none" stroke="#E52E42" strokeWidth="6" strokeDasharray="44 126" strokeDashoffset="0" />
                        <circle cx="26" cy="26" r="20" fill="none" stroke="#FCD34D" strokeWidth="6" strokeDasharray="25.1 126" strokeDashoffset="-44" />
                        <circle cx="26" cy="26" r="20" fill="none" stroke="#60A5FA" strokeWidth="6" strokeDasharray="18.9 126" strokeDashoffset="-69.1" />
                        <circle cx="26" cy="26" r="20" fill="none" stroke="#EC4899" strokeWidth="6" strokeDasharray="15.1 126" strokeDashoffset="-88" />
                        <circle cx="26" cy="26" r="20" fill="none" stroke="#94A3B8" strokeWidth="6" strokeDasharray="22.6 126" strokeDashoffset="-103.1" />
                        <text x="26" y="24" textAnchor="middle" className="text-[8px] font-bold" fill={NAVY}>571</text>
                        <text x="26" y="31" textAnchor="middle" className="text-[5px]" fill="#8B9BB5">Patients</text>
                      </svg>
                      <div className="space-y-1">
                        {[
                          { name: 'Malaria', c: '#E52E42' },
                          { name: 'Respiratory', c: '#FCD34D' },
                          { name: 'Diarrheal', c: '#60A5FA' },
                          { name: 'Maternal', c: '#EC4899' },
                          { name: 'Other', c: '#94A3B8' },
                        ].map(d => (
                          <div key={d.name} className="flex items-center gap-1 text-[6px]">
                            <span className="w-1.5 h-1.5 rounded" style={{ background: d.c }} />
                            <span style={{ color: '#6B7C93' }}>{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bed Occupancy */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <p className="text-[8px] font-semibold" style={{ color: NAVY }}>Bed Occupancy</p>
                        <span className="text-[6px] font-mono" style={{ color: '#8B9BB5' }}>(144/200)</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-[4px] h-[50px] sm:h-[60px]">
                      {[
                        { h: 80, c: '#E52E42', label: 'ICU' },
                        { h: 60, c: '#EC4899', label: 'Mat' },
                        { h: 45, c: '#60A5FA', label: 'Ped' },
                        { h: 70, c: '#3ECF8E', label: 'Gen' },
                        { h: 30, c: '#94A3B8', label: 'Avail' },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full rounded-t" style={{
                            height: `${bar.h}%`,
                            background: bar.c,
                            borderRadius: '3px 3px 0 0',
                            minWidth: '8px',
                          }} />
                          <span className="text-[5px]" style={{ color: '#8B9BB5' }}>{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* In/Out Patient Rate */}
                  <div className="p-2.5 sm:p-3 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
                  }}>
                    <p className="text-[8px] font-semibold mb-2" style={{ color: NAVY }}>In/Out Patient Rate</p>
                    {/* Mini line chart using SVG */}
                    <svg width="100%" height="55" viewBox="0 0 140 55" preserveAspectRatio="none">
                      <line x1="0" y1="54" x2="140" y2="54" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
                      <line x1="0" y1="36" x2="140" y2="36" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" strokeDasharray="2 2" />
                      <line x1="0" y1="18" x2="140" y2="18" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" strokeDasharray="2 2" />
                      {/* In Patients line (red) */}
                      <polyline points="10,30 45,22 85,35 125,15" fill="none" stroke="#E52E42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="30" r="2" fill="#E52E42" />
                      <circle cx="45" cy="22" r="2" fill="#E52E42" />
                      <circle cx="85" cy="35" r="2" fill="#E52E42" />
                      <circle cx="125" cy="15" r="2" fill="#E52E42" />
                      {/* Out Patients line (yellow) */}
                      <polyline points="10,42 45,38 85,40 125,32" fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="42" r="2" fill="#FCD34D" />
                      <circle cx="45" cy="38" r="2" fill="#FCD34D" />
                      <circle cx="85" cy="40" r="2" fill="#FCD34D" />
                      <circle cx="125" cy="32" r="2" fill="#FCD34D" />
                    </svg>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[6px]" style={{ color: '#6B7C93' }}>
                        <span className="w-2 h-[2px] rounded" style={{ background: '#E52E42' }} /> In Patients
                      </span>
                      <span className="flex items-center gap-1 text-[6px]" style={{ color: '#6B7C93' }}>
                        <span className="w-2 h-[2px] rounded" style={{ background: '#FCD34D' }} /> Out Patients
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section style={{ background: '#FFFFFF', paddingTop: '48px', paddingBottom: '48px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="site-row">
          <p className="text-center text-[11px] font-semibold tracking-[0.18em] uppercase mb-8" style={{ color: '#B0BDCD' }}>
            Supported by national and international health partners
          </p>
          <div className="flex items-center justify-start sm:justify-center gap-8 sm:gap-12 lg:gap-16 overflow-x-auto pb-2 no-scrollbar">
            {[
              { name: 'Ministry of Health', icon: HeartPulse },
              { name: 'WHO South Sudan', icon: Globe },
              { name: 'UNICEF', icon: Users },
              { name: 'USAID', icon: Building2 },
              { name: 'World Bank', icon: BarChart3 },
              { name: 'GAVI Alliance', icon: Syringe },
            ].map((partner) => (
              <div key={partner.name} className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-opacity duration-300 flex-shrink-0">
                <partner.icon className="w-4 h-4" style={{ color: NAVY }} />
                <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap" style={{ color: NAVY }}>
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="site-section" style={{ background: '#F8F9FB' }}>
        <div className="site-row">
          {/* Section header */}
          <div className="text-center mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{
              background: 'rgba(43,111,224,0.06)',
              border: '1px solid rgba(43,111,224,0.12)',
            }}>
              <Zap className="w-3.5 h-3.5" style={{ color: BLUE }} />
              <span className="text-[11px] font-semibold tracking-[0.03em]" style={{ color: BLUE }}>Core Capabilities</span>
            </div>
            <h2 className="font-display font-extrabold leading-[1.1]" style={{
              color: NAVY,
              letterSpacing: '-0.03em',
              fontSize: 'clamp(26px, 4vw, 44px)',
            }}>
              Everything you need to deliver
              <br className="hidden sm:block" />
              quality healthcare
            </h2>
            <p className="max-w-[540px] mx-auto mt-4 text-[14px] sm:text-[16px] leading-[1.7]" style={{ color: '#5A6B7F' }}>
              A comprehensive suite of tools designed for the unique challenges of healthcare delivery in South Sudan.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                icon: Users,
                title: 'Patient Management',
                desc: 'Register, track, and manage patient records across all facilities with full offline support and automatic syncing.',
                color: BLUE,
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                desc: 'Generate comprehensive reports on patient visits, disease patterns, resource utilization, and facility performance.',
                color: '#4FACE0',
              },
              {
                icon: Activity,
                title: 'Disease Surveillance',
                desc: 'Monitor disease outbreaks in real-time with automatic alerts, epidemic tracking, and IDSR integration.',
                color: '#E5574F',
              },
              {
                icon: HeartPulse,
                title: 'Maternal & Child Health',
                desc: 'Track antenatal care visits, immunizations, births, child growth monitoring, and nutritional assessments.',
                color: '#2B6FE0',
              },
              {
                icon: Syringe,
                title: 'EPI & Immunization',
                desc: 'Complete immunization tracking with coverage analytics, defaulter tracing, and cold chain monitoring.',
                color: '#8B6CE0',
              },
              {
                icon: FileText,
                title: 'Vital Statistics',
                desc: 'Birth and death registration integrated with CRVS, enabling accurate population health metrics.',
                color: '#FBB040',
              },
            ].map((feature) => (
              <div key={feature.title}
                className="p-6 sm:p-7 transition-all duration-300 group"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,39,68,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="w-12 h-12 flex items-center justify-center mb-5" style={{
                  background: `${feature.color}0D`,
                  border: `1px solid ${feature.color}1A`,
                  borderRadius: '12px',
                }}>
                  <feature.icon className="w-5.5 h-5.5" style={{ color: feature.color, width: '22px', height: '22px' }} />
                </div>
                <h3 className="text-[15px] sm:text-[16px] font-bold mb-2" style={{ color: NAVY }}>{feature.title}</h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: '#6B7C93' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM ===== */}
      <section id="platform" className="site-section" style={{ background: '#FFFFFF' }}>
        <div className="site-row">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: text content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{
                background: 'rgba(13,148,136,0.06)',
                border: '1px solid rgba(13,148,136,0.12)',
              }}>
                <Database className="w-3.5 h-3.5" style={{ color: '#0D9488' }} />
                <span className="text-[11px] font-semibold tracking-[0.03em]" style={{ color: '#0D9488' }}>Built for South Sudan</span>
              </div>

              <h2 className="font-display font-extrabold leading-[1.1] mb-5" style={{
                color: NAVY,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(26px, 4vw, 42px)',
              }}>
                Designed for the realities of healthcare delivery
              </h2>

              <p className="text-[14px] sm:text-[16px] leading-[1.75] mb-8" style={{ color: '#5A6B7F' }}>
                Taban understands that connectivity is unreliable, that health workers operate in remote areas,
                and that accurate data saves lives. Every feature is built with these realities in mind.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: Wifi,
                    title: 'Offline-First Architecture',
                    desc: 'Works entirely without internet. Data syncs automatically when connectivity is available using PouchDB/CouchDB replication.',
                  },
                  {
                    icon: Layers,
                    title: 'Multi-Tenant Hierarchy',
                    desc: 'Supports the full South Sudan health structure — from national level through states, counties, payams, and bomas.',
                  },
                  {
                    icon: Lock,
                    title: 'Role-Based Access Control',
                    desc: 'Granular permissions for doctors, nurses, lab techs, pharmacists, boma health workers, and government officials.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{
                      background: 'rgba(13,148,136,0.07)',
                      border: '1px solid rgba(13,148,136,0.12)',
                      borderRadius: '10px',
                    }}>
                      <item.icon className="w-5 h-5" style={{ color: '#0D9488' }} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold mb-1" style={{ color: NAVY }}>{item.title}</h3>
                      <p className="text-[13px] leading-[1.7]" style={{ color: '#6B7C93' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual card stack */}
            <div className="relative">
              {/* Background decorative element */}
              <div className="absolute inset-0 -m-4 rounded-3xl" style={{
                background: 'linear-gradient(135deg, #F8F9FB 0%, #EDF2FC 100%)',
                border: '1px solid rgba(0,0,0,0.04)',
              }} />

              <div className="relative space-y-4 p-6 sm:p-8">
                {/* Card 1: Facility hierarchy */}
                <div className="p-5 rounded-2xl" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(26,39,68,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${BLUE}10` }}>
                      <Building2 className="w-4 h-4" style={{ color: BLUE }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: NAVY }}>Health Facility Hierarchy</p>
                      <p className="text-[10px]" style={{ color: '#8B9BB5' }}>Multi-level administrative structure</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { level: 'National', count: '1 HQ', w: '100%' },
                      { level: 'State', count: '10 offices', w: '85%' },
                      { level: 'County', count: '79 units', w: '65%' },
                      { level: 'Facility', count: '87+ sites', w: '45%' },
                    ].map((l) => (
                      <div key={l.level} className="flex items-center gap-3">
                        <span className="text-[10px] font-medium w-14" style={{ color: '#6B7C93' }}>{l.level}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F0F2F5' }}>
                          <div className="h-full rounded-full" style={{ width: l.w, background: `linear-gradient(90deg, ${BLUE}, ${BLUE}99)` }} />
                        </div>
                        <span className="text-[9px] font-semibold w-14 text-right" style={{ color: NAVY }}>{l.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Modules */}
                <div className="p-5 rounded-2xl" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(26,39,68,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <p className="text-[12px] font-bold mb-3" style={{ color: NAVY }}>Integrated Health Modules</p>
                  <div className="flex flex-wrap gap-2">
                    {['OPD', 'Lab', 'Pharmacy', 'ANC', 'EPI', 'CRVS', 'Referrals', 'IDSR', 'Nutrition', 'HIV/TB'].map((mod) => (
                      <span key={mod} className="px-3 py-1.5 rounded-full text-[10px] font-semibold" style={{
                        background: '#F0F2F5',
                        color: '#5A6B7F',
                      }}>
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card 3: Sync status */}
                <div className="p-5 rounded-2xl" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(26,39,68,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-bold" style={{ color: NAVY }}>Data Sync Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#2B6FE0' }} />
                      <span className="text-[10px] font-medium" style={{ color: '#2B6FE0' }}>All synced</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Records', value: '24,847' },
                      { label: 'Last sync', value: '2m ago' },
                      { label: 'Pending', value: '0' },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: '#F8F9FB' }}>
                        <p className="text-[14px] font-bold font-display" style={{ color: NAVY }}>{s.value}</p>
                        <p className="text-[9px] font-medium" style={{ color: '#8B9BB5' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IMPACT ===== */}
      <section id="impact" className="site-section" style={{ background: '#F8F9FB' }}>
        <div className="site-row">
          {/* Header */}
          <div className="text-center mb-14">
            <h2 className="font-display font-extrabold leading-[1.1]" style={{
              color: NAVY,
              letterSpacing: '-0.03em',
              fontSize: 'clamp(26px, 4vw, 44px)',
            }}>
              Nationwide Coverage,{' '}
              <span style={{ color: BLUE }}>Real Impact</span>
            </h2>
            <p className="max-w-[500px] mx-auto mt-4 text-[14px] sm:text-[16px] leading-[1.7]" style={{ color: '#5A6B7F' }}>
              Connecting healthcare across all 10 states and 3 administrative areas of South Sudan.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
            {[
              { value: '87', label: 'Health Facilities', sub: 'Hospitals, PHCCs, PHCUs', icon: Building2, color: BLUE },
              { value: '11.4M', label: 'Citizens Covered', sub: 'Nationwide population', icon: Users, color: '#4FACE0' },
              { value: '10', label: 'States Connected', sub: 'Plus 3 admin areas', icon: MapPin, color: '#2B6FE0' },
              { value: '24/7', label: 'Offline Capability', sub: 'Works without internet', icon: Wifi, color: '#FBB040' },
            ].map((stat) => (
              <div key={stat.label} className="p-5 sm:p-7 text-center rounded-2xl transition-all duration-300" style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,39,68,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div className="w-11 h-11 flex items-center justify-center mx-auto mb-3" style={{
                  background: `${stat.color}0D`,
                  border: `1px solid ${stat.color}1A`,
                  borderRadius: '12px',
                }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <p className="font-display font-extrabold" style={{
                  color: NAVY,
                  letterSpacing: '-0.03em',
                  fontSize: 'clamp(24px, 3vw, 36px)',
                }}>{stat.value}</p>
                <p className="text-[12px] sm:text-[13px] font-semibold mt-1" style={{ color: '#4A5568' }}>{stat.label}</p>
                <p className="text-[10px] sm:text-[11px] mt-0.5" style={{ color: '#8B9BB5' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { role: 'Clinical Staff', desc: 'Doctors, nurses, and clinical officers managing patient care with full EHR access.', color: BLUE, users: '1,200+' },
              { role: 'Community Health Workers', desc: 'Boma health workers and payam supervisors delivering care at the grassroots level.', color: '#2B6FE0', users: '3,400+' },
              { role: 'Government Officials', desc: 'National and state health authorities monitoring outcomes and resource allocation.', color: '#4FACE0', users: '150+' },
            ].map((r) => (
              <div key={r.role} className="p-5 sm:p-6 rounded-2xl" style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{
                    background: `${r.color}0D`,
                    border: `1px solid ${r.color}1A`,
                    borderRadius: '10px',
                  }}>
                    <Users className="w-5 h-5" style={{ color: r.color }} />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: `${r.color}0D`, color: r.color }}>{r.users}</span>
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-bold mb-1.5" style={{ color: NAVY }}>{r.role}</h3>
                <p className="text-[12px] sm:text-[13px] leading-[1.7]" style={{ color: '#6B7C93' }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="about" className="site-section" style={{
        background: `linear-gradient(165deg, ${NAVY} 0%, #0F1B30 50%, #162640 100%)`,
      }}>
        <div className="site-row text-center" style={{ maxWidth: '860px' }}>
          {/* South Sudan flag accent */}
          <div className="flex w-20 sm:w-24 h-[3px] mx-auto mb-8 sm:mb-10 rounded-full overflow-hidden">
            <div className="flex-1" style={{ background: '#0A0A0A' }} />
            <div className="flex-1" style={{ background: '#E52E42' }} />
            <div className="flex-1" style={{ background: '#2B6FE0' }} />
            <div className="flex-1" style={{ background: '#2B6FE0' }} />
            <div className="flex-1" style={{ background: '#FCD34D' }} />
          </div>

          <h2 className="font-display font-extrabold text-white leading-[1.1]" style={{
            letterSpacing: '-0.03em',
            fontSize: 'clamp(24px, 4vw, 40px)',
          }}>
            Ready to transform healthcare
            <br className="hidden sm:block" />
            delivery in your facility?
          </h2>

          <p className="text-[14px] sm:text-[16px] mt-4 leading-[1.7] max-w-[500px] mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join 87 facilities already using Taban to deliver better, data-driven care for the people of South Sudan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link href="/login" className="flex items-center justify-center gap-2.5 text-[15px] font-semibold text-white rounded-full transition-all duration-200 w-full sm:w-auto"
              style={{
                background: BLUE,
                padding: '15px 40px',
                boxShadow: '0 4px 24px rgba(43,111,224,0.4)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_HOVER; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Access Platform <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Logos */}
          <div className="flex items-center justify-center gap-4 mt-10 sm:mt-12">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/ssrp.svg" alt="South Sudan" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/moh.jpg" alt="Ministry of Health" className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-sm" />
              </div>
            </div>
            <div className="w-px h-7" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: BLUE }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '28px 0' }}>
        <div className="site-row">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[12px] font-extrabold tracking-[0.1em]" style={{ color: NAVY }}>TABAN</span>
              <span className="text-[10px] font-medium ml-1 px-2 py-0.5 rounded-full" style={{ background: '#F0F2F5', color: '#8B9BB5' }}>v2.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3 h-3" style={{ color: '#B0BDCD' }} />
              <p className="text-[11px]" style={{ color: '#8B9BB5' }}>
                Republic of South Sudan &middot; Ministry of Health &middot; Digital Health Division
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
