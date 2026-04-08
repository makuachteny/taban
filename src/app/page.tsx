"use client";

import { useState, useEffect, useRef } from "react";
import {
  WifiOff, Shield, Brain, Activity, Baby, Download,
  ArrowRight, Check, ChevronDown, ChevronUp, Play, Phone,
  Mail, MapPin, Building2, Users, Globe, Lock, Database,
  GraduationCap, DollarSign, Video, Calendar,
  HeartPulse, ClipboardCheck, Zap, BarChart3,
  Menu, X, Server, Star,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════
   TABAN — Landing Page
   Aesthetic: Premium Medical SaaS — ModMed-inspired
   Clean whites, azure blue, geometric precision, clinical confidence
   ═══════════════════════════════════════════════════════════════════ */

// ─── Intersection Observer Hook ─────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated Counter ───────────────────────────────────────────
function Counter({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Smooth scroll helper ───────────────────────────────────────
const HERO_STATS = [
  { icon: Shield, value: "100%", label: "Offline first", sub: "Works without connectivity" },
  { icon: Activity, value: "11.4M", label: "People covered", sub: "Live facility & community data" },
  { icon: Download, value: "Instant", label: "Sync to National", sub: "Auto push to DHIS2-ready store" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", org: "", role: "", phone: "", message: "" });
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoErrors, setDemoErrors] = useState<Record<string, string>>({});
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSubmitError, setDemoSubmitError] = useState<string | null>(null);
  const [demoScheduleUrl, setDemoScheduleUrl] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Feature auto-rotate
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const validateDemo = () => {
    const errors: Record<string, string> = {};
    if (!demoForm.name.trim()) errors.name = "Name is required";
    if (!demoForm.email.trim() || !/\S+@\S+\.\S+/.test(demoForm.email)) errors.email = "Valid email required";
    if (!demoForm.org.trim()) errors.org = "Organization is required";
    if (!demoForm.role) errors.role = "Please select a role";
    setDemoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDemo()) return;
    setDemoSubmitting(true);
    setDemoSubmitError(null);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setDemoSubmitError(data?.error || 'Failed to submit demo request');
        return;
      }
      setDemoScheduleUrl(data?.scheduleUrl || null);
      setDemoSubmitted(true);
    } catch {
      setDemoSubmitError('Network error. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const scheduleFallback = `mailto:tenymakuach@gmail.com?subject=${encodeURIComponent('Taban Demo Scheduling')}&body=${encodeURIComponent(`Hi Taban team,\n\nI just requested a demo. Please share available times.\n\nName: ${demoForm.name}\nOrganization: ${demoForm.org}\nEmail: ${demoForm.email}`)}`;
  const scheduleHref = demoScheduleUrl || scheduleFallback;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />

      {/* ════════ STICKY HEADER ════════ */}
      <header className={`tb-header ${scrolled ? "tb-header--scrolled" : ""}`}>
        <div className="tb-container tb-header__inner">
          <div className="tb-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/taban-icon.svg" alt="Taban" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <span className="tb-logo__text">TABAN</span>
          </div>

          <nav className="tb-nav">
            {["Features", "Solutions", "Pricing", "About"].map(s => (
              <button key={s} className="tb-nav__link" onClick={() => scrollTo(s.toLowerCase())}>{s}</button>
            ))}
          </nav>

          <div className="tb-header__actions">
            <Link href="/patient-portal" className="tb-btn tb-btn--ghost">Patient Portal</Link>
            <Link href="/login" className="tb-btn tb-btn--ghost">Staff Sign In</Link>
            <button className="tb-btn tb-btn--primary" onClick={() => setShowDemoModal(true)}>
              Get a Demo <ArrowRight size={15} />
            </button>
          </div>

          <button className="tb-mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileNav && (
          <div className="tb-mobile-nav">
            {["Features", "Solutions", "Pricing", "About"].map(s => (
              <button key={s} className="tb-mobile-nav__link" onClick={() => { scrollTo(s.toLowerCase()); setMobileNav(false); }}>{s}</button>
            ))}
            <Link href="/login" className="tb-btn tb-btn--ghost" style={{ width: "100%", textAlign: "center" }}>Staff Sign In</Link>
            <button className="tb-btn tb-btn--primary" style={{ width: "100%" }} onClick={() => { setShowDemoModal(true); setMobileNav(false); }}>Get a Demo</button>
          </div>
        )}
      </header>

      <main className="tb-main">
        {/* ════════ HERO ════════ */}
        <section className="tb-hero">
          <div className="tb-hero__mesh" />
          <div className="tb-container tb-hero__layout">
            <div className="tb-hero__content">
              <h1 className="tb-hero__title">
                The EHR built by people, for people,<br /><span className="tb-hero__title--gradient">with people.</span>
              </h1>
              <p className="tb-hero__subtitle">
                67% of South Sudan&apos;s health facilities report zero data. Taban is the offline-first
                health record system serving 11.4 million people &mdash; from village health workers to
                the Ministry of Health.
              </p>
              <div className="tb-hero__stats">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="tb-hero__stat-card">
                    <stat.icon className="tb-hero__stat-icon" />
                    <div>
                      <div className="tb-hero__stat-value">{stat.value}</div>
                      <div className="tb-hero__stat-label">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tb-hero__ctas">
                <button className="tb-btn tb-btn--hero" onClick={() => setShowDemoModal(true)}>
                  Request a Demo <ArrowRight size={16} />
                </button>
                <button className="tb-btn tb-btn--hero-outline" onClick={() => scrollTo("features")}>
                  <Play size={14} /> See How It Works
                </button>
              </div>
              <div className="tb-hero__trust">
                <div className="tb-hero__trust-logos">
                  <div className="tb-trust-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/moh.jpg" alt="Ministry of Health" style={{ height: 36, borderRadius: 6 }} />
                  </div>
                  <div className="tb-trust-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/ssrp.svg" alt="SSRP" style={{ height: 32 }} />
                  </div>
                  <div className="tb-trust-item tb-trust-item--badge">WHO Aligned</div>
                  <div className="tb-trust-item tb-trust-item--badge">ISO 13606</div>
                </div>
              </div>
            </div>
            <div className="tb-hero__visual">
              <div className="tb-hero__dashboard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/dashboard-screenshot.png" alt="Taban Dashboard" className="tb-hero__dashboard-img" />
              </div>
            </div>
          </div>
        </section>

        {/* ════════ SOCIAL PROOF TICKER ════════ */}
        <section className="tb-ticker">
          <div className="tb-container">
            <div className="tb-ticker__grid">
              {IMPACT_METRICS.map((m, i) => (
                <div key={i} className="tb-ticker__item">
                  <div className="tb-ticker__value">
                    <Counter end={m.value} suffix={m.suffix} prefix={m.prefix} />
                  </div>
                  <div className="tb-ticker__label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PROBLEM STATEMENT ════════ */}
        <section className="tb-problem" id="about">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">The Challenge</span>
                <h2 className="tb-heading">A health system <em>without</em> data,<br />is a health system <em>without</em> hope.</h2>
                <p className="tb-lead">
                  South Sudan faces compounding barriers that make conventional EHR systems impossible.
                  Taban was designed from the ground up to solve every one of them.
                </p>
              </div>
            </SectionIn>
            <div className="tb-problem__grid">
              {PROBLEM_STATS.map((s, i) => (
                <SectionIn key={i}>
                  <div className="tb-stat-card">
                    <div className="tb-stat-card__top">
                      <div className="tb-stat-card__number" style={{ color: s.color }}>
                        <Counter end={s.value} suffix={s.suffix} prefix={s.prefix} />
                      </div>
                      <div className="tb-stat-card__dot" style={{ background: s.color }} />
                    </div>
                    <div className="tb-stat-card__label">{s.label}</div>
                    <p className="tb-stat-card__desc">{s.desc}</p>
                  </div>
                </SectionIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FEATURES (Tabbed) ════════ */}
        <section className="tb-features" id="features">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">Platform</span>
                <h2 className="tb-heading"><em>Everything</em> you need.<br />Nothing you don&apos;t.</h2>
              </div>
            </SectionIn>
            <div className="tb-features__layout">
              <div className="tb-features__tabs">
                {FEATURES.map((f, i) => (
                  <button
                    key={i}
                    className={`tb-features__tab ${activeFeature === i ? "tb-features__tab--active" : ""}`}
                    onClick={() => setActiveFeature(i)}
                  >
                    <f.icon size={18} />
                    <span>{f.title}</span>
                    {activeFeature === i && <ArrowRight size={14} className="tb-features__tab-arrow" />}
                  </button>
                ))}
              </div>
              <div className="tb-features__panel">
                <div className="tb-features__panel-header">
                  <div className="tb-features__panel-icon" style={{ background: FEATURES[activeFeature].color + "10", color: FEATURES[activeFeature].color }}>
                    {(() => { const Icon = FEATURES[activeFeature].icon; return <Icon size={24} />; })()}
                  </div>
                  <div>
                    <h3 className="tb-features__panel-title">{FEATURES[activeFeature].title}</h3>
                    <p className="tb-features__panel-desc">{FEATURES[activeFeature].desc}</p>
                  </div>
                </div>
                <ul className="tb-features__panel-list">
                  {FEATURES[activeFeature].bullets.map((b, i) => (
                    <li key={i}><Check size={16} className="tb-check" /> {b}</li>
                  ))}
                </ul>
                <div className="tb-features__mock">
                  <div className="tb-features__mock-bar">
                    <div className="tb-features__mock-dots"><span /><span /><span /></div>
                    <span className="tb-features__mock-label">{FEATURES[activeFeature].title}</span>
                  </div>
                  <div className="tb-features__mock-body">
                    {FEATURES[activeFeature].mockRows.map((r, i) => (
                      <div key={i} className="tb-features__mock-row" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="tb-features__mock-indicator" style={{ background: FEATURES[activeFeature].color }} />
                        <div className="tb-features__mock-text">{r}</div>
                        <div className="tb-features__mock-tag" style={{ background: FEATURES[activeFeature].color + "12", color: FEATURES[activeFeature].color }}>
                          <Star size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ HOW IT WORKS ════════ */}
        <section className="tb-how">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">Implementation</span>
                <h2 className="tb-heading">From zero to <em>live</em> in 30 days</h2>
                <p className="tb-lead">Our battle-tested deployment process gets your facilities running fast.</p>
              </div>
            </SectionIn>
            <div className="tb-how__grid">
              {HOW_STEPS.map((s, i) => (
                <SectionIn key={i}>
                  <div className="tb-how__step">
                    <div className="tb-how__step-connector">
                      <div className="tb-how__step-num">{String(i + 1).padStart(2, "0")}</div>
                      {i < HOW_STEPS.length - 1 && <div className="tb-how__step-line" />}
                    </div>
                    <div className="tb-how__step-body">
                      <div className="tb-how__step-icon" style={{ background: s.color + "0D", color: s.color }}>
                        <s.icon size={22} />
                      </div>
                      <h3 className="tb-how__step-title">{s.title}</h3>
                      <p className="tb-how__step-desc">{s.desc}</p>
                      <span className="tb-how__step-time">{s.time}</span>
                    </div>
                  </div>
                </SectionIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ SOLUTIONS BY SECTOR ════════ */}
        <section className="tb-solutions" id="solutions">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">Solutions</span>
                <h2 className="tb-heading">Purpose-built for <em>every</em> stakeholder</h2>
              </div>
            </SectionIn>
            <div className="tb-solutions__grid">
              {SOLUTIONS.map((s, i) => (
                <SectionIn key={i}>
                  <div className="tb-solutions__card">
                    <div className="tb-solutions__card-top" style={{ background: `${s.color}06` }}>
                      <div className="tb-solutions__card-icon" style={{ color: s.color, background: s.color + "12" }}>
                        <s.icon size={24} />
                      </div>
                      <h3 className="tb-solutions__card-title">{s.title}</h3>
                      <p className="tb-solutions__card-desc">{s.desc}</p>
                    </div>
                    <div className="tb-solutions__card-bottom">
                      <ul className="tb-solutions__card-features">
                        {s.features.map((f, j) => <li key={j}><Check size={14} className="tb-check" /> {f}</li>)}
                      </ul>
                      <div className="tb-solutions__card-price">
                        <span className="tb-solutions__card-from">Starting from</span>
                        <span className="tb-solutions__card-amount">{s.price}</span>
                      </div>
                      <button className="tb-btn tb-btn--card" style={{ borderColor: s.color, color: s.color }} onClick={() => setShowDemoModal(true)}>
                        Get Started <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </SectionIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ CHALLENGES ADDRESSED ════════ */}
        <section className="tb-challenges">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">Why Taban</span>
                <h2 className="tb-heading">Every challenge. <em>Addressed.</em></h2>
                <p className="tb-lead">We studied what makes EHR deployments fail in fragile states and engineered solutions for each one.</p>
              </div>
            </SectionIn>
            <div className="tb-challenges__grid">
              {CHALLENGES.map((c, i) => (
                <SectionIn key={i}>
                  <div className="tb-challenges__card">
                    <div className="tb-challenges__card-icon" style={{ background: c.color + "0A", color: c.color }}>
                      <c.icon size={20} />
                    </div>
                    <h4 className="tb-challenges__card-title">{c.challenge}</h4>
                    <p className="tb-challenges__card-solution">{c.solution}</p>
                  </div>
                </SectionIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PRICING ════════ */}
        <section className="tb-pricing" id="pricing">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">Pricing</span>
                <h2 className="tb-heading">Transparent pricing. <em>No surprises.</em></h2>
                <p className="tb-lead">Offline-first architecture means dramatically lower infrastructure costs than any competitor.</p>
              </div>
            </SectionIn>
            <div className="tb-pricing__grid">
              {PRICING.map((p, i) => (
                <SectionIn key={i}>
                  <div className={`tb-pricing__card ${p.featured ? "tb-pricing__card--featured" : ""}`}>
                    {p.featured && <div className="tb-pricing__badge">Recommended</div>}
                    <h3 className="tb-pricing__name">{p.name}</h3>
                    <p className="tb-pricing__target">{p.target}</p>
                    <div className="tb-pricing__amount">
                      <span className="tb-pricing__currency">$</span>
                      <span className="tb-pricing__number">{p.price}</span>
                      <span className="tb-pricing__period">/facility/mo</span>
                    </div>
                    <div className="tb-pricing__divider" />
                    <ul className="tb-pricing__features">
                      {p.features.map((f, j) => <li key={j}><Check size={14} className="tb-check" /> {f}</li>)}
                    </ul>
                    <button
                      className={`tb-btn ${p.featured ? "tb-btn--primary" : "tb-btn--outline"}`}
                      style={{ width: "100%" }}
                      onClick={() => setShowDemoModal(true)}
                    >
                      {p.featured ? "Get Started" : "Contact Sales"} <ArrowRight size={14} />
                    </button>
                  </div>
                </SectionIn>
              ))}
            </div>
            <p className="tb-pricing__note">
              Government facilities eligible for donor-subsidized pricing. Implementation &amp; training from $5,000 per facility.
            </p>
          </div>
        </section>

        {/* ════════ DEMO CTA SECTION ════════ */}
        <section className="tb-demo" id="demo">
          <div className="tb-container" style={{ textAlign: "center", maxWidth: 640 }}>
            <SectionIn>
              <span className="tb-eyebrow tb-eyebrow--light">Get Started</span>
              <h2 className="tb-heading tb-heading--light">See Taban <em>in action</em></h2>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
                Schedule a 30-minute personalized walkthrough. See all 11 dashboards, offline-first capabilities,
                and how Taban transforms healthcare delivery at your facility.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
                {["Personalized walkthrough", "Offline demo", "Custom facility setup", "No commitment"].map((p, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <Check size={14} /> {p}
                  </span>
                ))}
              </div>
              <button className="tb-btn tb-btn--cta" onClick={() => setShowDemoModal(true)}>
                Request a Demo <ArrowRight size={16} />
              </button>
            </SectionIn>
          </div>
        </section>

        {/* ════════ DEMO MODAL POPUP ════════ */}
        {showDemoModal && (
          <div className="tb-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDemoModal(false); }}>
            <div className="tb-modal-panel">
              <button className="tb-modal-close" onClick={() => setShowDemoModal(false)}><X size={18} /></button>
              {demoSubmitted ? (
                <div className="tb-demo__success">
                  <div className="tb-demo__success-icon"><Check size={28} /></div>
                  <h3>Request Received</h3>
                  <p>Thank you, {demoForm.name}! Our team will contact you within 24 hours.</p>
                  <div className="tb-demo__success-actions">
                    <a className="tb-btn tb-btn--primary" href={scheduleHref} target="_blank" rel="noreferrer">
                      Schedule Demo <Calendar size={14} />
                    </a>
                    <button className="tb-btn tb-btn--outline" onClick={() => { setShowDemoModal(false); setDemoSubmitted(false); }}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form className="tb-demo__form" onSubmit={handleDemoSubmit}>
                  <h3 className="tb-demo__form-title">Request a Free Demo</h3>
                  <p className="tb-demo__form-sub">Fill out the form and we&apos;ll be in touch shortly.</p>
                  {demoSubmitError && <div className="tb-demo__error">{demoSubmitError}</div>}
                  {[
                    { key: "name", label: "Full Name", type: "text", placeholder: "Dr. Wani Lado" },
                    { key: "email", label: "Work Email", type: "email", placeholder: "wani@hospital.org" },
                    { key: "org", label: "Organization", type: "text", placeholder: "Juba Teaching Hospital" },
                    { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+211 9XX XXX XXX" },
                  ].map(f => (
                    <div key={f.key} className="tb-field">
                      <label className="tb-field__label">{f.label}</label>
                      <input
                        className={`tb-field__input ${demoErrors[f.key] ? "tb-field__input--error" : ""}`}
                        type={f.type} placeholder={f.placeholder}
                        value={demoForm[f.key as keyof typeof demoForm]}
                        onChange={e => setDemoForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                      {demoErrors[f.key] && <span className="tb-field__error">{demoErrors[f.key]}</span>}
                    </div>
                  ))}
                  <div className="tb-field">
                    <label className="tb-field__label">Your Role</label>
                    <select className={`tb-field__input ${demoErrors.role ? "tb-field__input--error" : ""}`} value={demoForm.role} onChange={e => setDemoForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="">Select your role...</option>
                      {["Hospital Administrator", "Doctor / Clinical Officer", "Nurse", "IT Manager", "Government Official", "NGO Program Manager", "Other"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {demoErrors.role && <span className="tb-field__error">{demoErrors.role}</span>}
                  </div>
                  <div className="tb-field">
                    <label className="tb-field__label">Message (optional)</label>
                    <textarea className="tb-field__input" rows={3} placeholder="Tell us about your facility and needs..." value={demoForm.message} onChange={e => setDemoForm(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <button type="submit" className="tb-btn tb-btn--primary" style={{ width: "100%", opacity: demoSubmitting ? 0.7 : 1 }} disabled={demoSubmitting}>
                    {demoSubmitting ? "Submitting..." : "Submit Request"} <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ════════ FAQ ════════ */}
        <section className="tb-faq">
          <div className="tb-container">
            <SectionIn>
              <div className="tb-section-header">
                <span className="tb-eyebrow">FAQ</span>
                <h2 className="tb-heading">Common questions</h2>
              </div>
            </SectionIn>
            <div className="tb-faq__list">
              {FAQS.map((f, i) => (
                <div key={i} className={`tb-faq__item ${openFaq === i ? "tb-faq__item--open" : ""}`}>
                  <button className="tb-faq__question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openFaq === i && <div className="tb-faq__answer">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FINAL CTA ════════ */}
        <section className="tb-cta">
          <div className="tb-container tb-cta__inner">
            <SectionIn>
              <h2 className="tb-cta__title">67% of facilities report nothing today.<br /><em>Let&apos;s change that.</em></h2>
              <p className="tb-cta__desc">Join the movement to bring data-driven healthcare to 11.4 million South Sudanese.</p>
              <div className="tb-cta__buttons">
                <button className="tb-btn tb-btn--cta" onClick={() => setShowDemoModal(true)}>
                  Request Your Demo <ArrowRight size={16} />
                </button>
                <Link href="/login" className="tb-btn tb-btn--cta-outline">
                  Staff Sign In
                </Link>
              </div>
            </SectionIn>
          </div>
        </section>
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="tb-footer">
        <div className="tb-container">
          <div className="tb-footer__grid">
            <div className="tb-footer__brand">
              <div className="tb-logo" style={{ marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/taban-icon.svg" alt="Taban" style={{ width: 30, height: 30, borderRadius: 8 }} />
                <span className="tb-logo__text" style={{ color: "#fff" }}>TABAN</span>
              </div>
              <p className="tb-footer__tagline">&ldquo;Hope&rdquo; in Dinka. Purpose-built digital health records for the world&apos;s hardest health environments.</p>
              <p className="tb-footer__built">Built by South Sudanese, for South Sudan.</p>
            </div>
            <div className="tb-footer__col">
              <h4>Platform</h4>
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("solutions")}>Solutions</button>
              <button onClick={() => scrollTo("pricing")}>Pricing</button>
              <button onClick={() => setShowDemoModal(true)}>Request Demo</button>
            </div>
            <div className="tb-footer__col">
              <h4>Resources</h4>
              <button onClick={() => scrollTo("about")}>About</button>
              <button onClick={() => scrollTo("faq")}>FAQ</button>
              <Link href="/public-stats">Public Statistics</Link>
              <Link href="/login">Staff Sign In</Link>
            </div>
            <div className="tb-footer__col">
              <h4>Contact</h4>
              <div className="tb-footer__contact"><Mail size={14} /> info@taban.health</div>
              <div className="tb-footer__contact"><Phone size={14} /> +211 912 345 678</div>
              <div className="tb-footer__contact"><MapPin size={14} /> Juba, South Sudan</div>
            </div>
          </div>
          <div className="tb-footer__bottom">
            <p>&copy; {new Date().getFullYear()} Taban Health Technologies. All rights reserved.</p>
            <div className="tb-footer__badges">
              <span><Shield size={12} /> ISO 13606</span>
              <span><Lock size={12} /> ISO 13131</span>
              <span><Globe size={12} /> DHIS2 Compatible</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// ─── Section Animation Wrapper ──────────────────────────────────
function SectionIn({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref} className={`tb-reveal ${inView ? "tb-reveal--visible" : ""}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════

const PROBLEM_STATS = [
  { value: 67, suffix: "%", prefix: "", label: "Facilities Non-Reporting", desc: "Two-thirds of health facilities submit zero data to the national DHIS2 system.", color: "#0077D7" },
  { value: 0, suffix: "", prefix: "", label: "National ID System", desc: "No government identification system exists. Patients can't be tracked across facilities.", color: "#0A5FC2" },
  { value: 11, suffix: ".4M", prefix: "", label: "People Unserved", desc: "11.4 million South Sudanese with no reliable digital health records whatsoever.", color: "#0077D7" },
  { value: 60, suffix: "+", prefix: "", label: "Languages Spoken", desc: "No single lingua franca. Existing tools require literacy most health workers don't have.", color: "#0A3D6B" },
];

const FEATURES: { title: string; icon: typeof Shield; desc: string; bullets: string[]; color: string; mockRows: string[] }[] = [
  {
    title: "Patient Records", icon: Users, color: "#0077D7",
    desc: "Complete electronic health records with geocode-based patient identification. No national ID needed — BOMA-{code}-HH{number} tracks patients by village and household.",
    bullets: ["Photo-based patient identification", "Geocode IDs for populations without national IDs", "Full medical history, vitals, and diagnoses", "Cross-facility record sharing via sync"],
    mockRows: ["Ayen Makuei — ANC", "Deng Ajak — Hypertension", "Nyabol Garang — Malaria", "Akech Deng — Immunization"],
  },
  {
    title: "Offline-First", icon: WifiOff, color: "#0A5FC2",
    desc: "Works 100% without internet. Every feature, every dashboard, every record — available offline. Data syncs automatically when connectivity returns. Zero data loss.",
    bullets: ["PouchDB local storage — full function offline", "Automatic background sync via CouchDB", "Conflict resolution for multi-site editing", "Service worker for instant page loads"],
    mockRows: ["Last sync: 2m ago", "Local records: 1,247", "Pending sync: 3 docs", "Connection: Offline"],
  },
  {
    title: "AI Diagnosis", icon: Brain, color: "#0A3D6B",
    desc: "Rule-based clinical decision support running entirely in the browser. WHO/IMCI guideline-aligned. Suggests diagnoses, treatments, and lab orders — no internet required.",
    bullets: ["15+ priority diseases covered", "ICD-10/ICD-11 coding", "Severity assessment and triage", "Suggested treatments per WHO guidelines"],
    mockRows: ["Malaria — 87% conf.", "Pneumonia — 42% conf.", "Suggested: RDT, FBC", "Severity: Moderate"],
  },
  {
    title: "Surveillance", icon: Activity, color: "#0077D7",
    desc: "Real-time disease surveillance and epidemic intelligence. IDSR-aligned weekly reporting. Outbreak detection at the boma level before it reaches the county.",
    bullets: ["Automated outbreak alert thresholds", "Geographic cluster detection", "IDSR weekly report generation", "State and national aggregate views"],
    mockRows: ["Cholera — Jonglei: WARNING", "Measles — WBeG: WATCH", "Malaria — C.Eq: NORMAL", "IDSR Week 12: Submitted"],
  },
  {
    title: "Appointments", icon: Calendar, color: "#0A5FC2",
    desc: "Patient appointment booking from payam level and above. Schedule, confirm, check in, and track across departments. Recurring appointments for chronic care.",
    bullets: ["Scheduling conflict detection", "SMS appointment reminders", "Recurring follow-up support", "No-show and completion tracking"],
    mockRows: ["09:00 — Dr. Wani — General", "10:30 — ANC Follow-up", "14:00 — Lab Collection", "15:30 — Specialist Ref."],
  },
  {
    title: "Telehealth", icon: Video, color: "#0A3D6B",
    desc: "Virtual consultations for private sector facilities. Video, audio, and chat sessions with clinical documentation, consent tracking, and billing — ISO 13131 compliant.",
    bullets: ["Video, audio, and chat sessions", "Patient consent and quality monitoring", "Clinical notes with ICD-10 coding", "Consultation fee and payment tracking"],
    mockRows: ["Session: taban-a3f9...", "Type: Video Call", "Duration: 24 min", "Rating: 4.8/5"],
  },
  {
    title: "Birth & Death (CRVS)", icon: Baby, color: "#0077D7",
    desc: "WHO-compliant civil registration and vital statistics. Birth certificates, death certificates with ICD-11 cause-of-death coding. Maternal death linkage for MMR tracking.",
    bullets: ["WHO medical certificate format", "ICD-11 cause-of-death coding", "Maternal mortality linkage", "Delivery attendant classification"],
    mockRows: ["Births this month: 47", "Deaths registered: 12", "MMR tracking: Active", "Certificates: 59 issued"],
  },
  {
    title: "DHIS2 Export", icon: Download, color: "#0A5FC2",
    desc: "We don't replace the national health information system — we feed it. Automated data aggregation and export to DHIS2 for government reporting and donor accountability.",
    bullets: ["Automated monthly aggregation", "DHIS2 data element mapping", "Facility and district level reports", "Donor reporting templates"],
    mockRows: ["Export: March 2026", "Facilities: 5/5 ready", "Data elements: 142", "Status: Ready to submit"],
  },
];

const HOW_STEPS = [
  { title: "Assess & Configure", desc: "We assess your facility's needs, configure role-based dashboards, and set up organization branding. Your system is tailored before day one.", time: "Week 1", icon: ClipboardCheck, color: "#0077D7" },
  { title: "Train Your Team", desc: "On-site training for every role — from front desk to doctors. Icon-based guides for low-literacy health workers. Facility champions are designated.", time: "Week 2", icon: GraduationCap, color: "#0A5FC2" },
  { title: "Deploy & Go Live", desc: "Tablets deployed, data migrated, system live. Full offline function from minute one. No internet dependency for any clinical workflow.", time: "Week 3", icon: Zap, color: "#0A3D6B" },
  { title: "Support & Scale", desc: "Ongoing remote support, bug fixes, and feature updates. Expand to additional facilities as your organization grows.", time: "Ongoing", icon: BarChart3, color: "#0077D7" },
];

const SOLUTIONS = [
  {
    title: "Private Hospitals", icon: Building2, color: "#0077D7",
    desc: "Full-featured EHR with telehealth, appointment booking, AI diagnosis, and billing. Professional and Enterprise tiers with multi-facility admin.",
    features: ["Telehealth video consultations", "Appointment scheduling", "Lab, pharmacy, and referral management", "AI-assisted diagnosis", "Patient billing integration", "Custom organization branding"],
    price: "$200/facility/mo",
  },
  {
    title: "Government & MOH", icon: Globe, color: "#0A5FC2",
    desc: "National health system integration with DHIS2 export, disease surveillance, and facility performance monitoring. Donor-subsidized pricing available.",
    features: ["National surveillance dashboard", "DHIS2 automated export", "Facility assessment scoring", "Data quality monitoring", "10-state coverage", "Government role-based access"],
    price: "$75/facility/mo",
  },
  {
    title: "NGOs & INGOs", icon: HeartPulse, color: "#0A3D6B",
    desc: "Program-specific deployments for health interventions. Immunization campaigns, ANC tracking, community health worker management, and donor reporting.",
    features: ["Community health worker dashboards", "Immunization defaulter tracking", "MCH analytics and reporting", "Boma-level household visits", "Donor-ready reports", "Multi-program support"],
    price: "$100/facility/mo",
  },
];

const IMPACT_METRICS = [
  { value: 87, suffix: "", prefix: "", label: "Hospitals Ready" },
  { value: 500, suffix: "K+", prefix: "", label: "Patients Targetted" },
  { value: 10, suffix: "", prefix: "", label: "States Covered" },
  { value: 99, suffix: ".9%", prefix: "", label: "Offline Uptime" },
];

const CHALLENGES: { challenge: string; solution: string; icon: typeof Shield; color: string }[] = [
  { challenge: "Security Breaches", solution: "JWT authentication, bcrypt password hashing, rate limiting, audit logging, HTTP-only cookies, and Content Security Policy headers. Data stays on-device until sync.", icon: Lock, color: "#0077D7" },
  { challenge: "Data Storage Limitations", solution: "PouchDB local-first architecture stores all data on-device. CouchDB bidirectional sync handles replication. PostgreSQL for server-side analytics. Scales to thousands of facilities.", icon: Database, color: "#0A5FC2" },
  { challenge: "Data Inconsistencies", solution: "Typed TypeScript interfaces enforce data integrity. Validation at entry. Last-write-wins conflict resolution with timestamps. ICD-10/ICD-11 standardized coding throughout.", icon: ClipboardCheck, color: "#0A3D6B" },
  { challenge: "Interoperability", solution: "DHIS2 export feeds the national system. ISO 13606 health record communication standard. Referral transfer packages move complete patient data between facilities.", icon: Server, color: "#0077D7" },
  { challenge: "Implementation Cost", solution: "Offline-first = minimal server infrastructure. No per-user cloud fees. Tablets from $200. Total Tier 1 deployment for 5 facilities: $10,000 including hardware, training, and 6 months of support.", icon: DollarSign, color: "#0A5FC2" },
  { challenge: "Training & Adoption", solution: "Icon-driven interfaces for low-literacy workers. Photo-based patient IDs. 2-day on-site training. Facility champion stipends. Designed so simple a primary school child can use it.", icon: GraduationCap, color: "#0A3D6B" },
];

const PRICING = [
  {
    name: "Basic", target: "Village clinics & PHCUs", price: 200, featured: false,
    features: ["Patient records & registration", "Offline sync", "Basic reporting", "10 user accounts", "Geocode patient IDs", "SMS notifications", "Email support"],
  },
  {
    name: "Professional", target: "County & state hospitals", price: 300, featured: true,
    features: ["Everything in Basic", "AI-assisted diagnosis", "Lab & pharmacy modules", "Referral management", "Appointment booking", "DHIS2 export", "25 user accounts", "Priority support"],
  },
  {
    name: "Enterprise", target: "Teaching hospitals & NGO programs", price: 500, featured: false,
    features: ["Everything in Professional", "Telehealth services", "Epidemic intelligence", "MCH analytics", "Multi-facility admin", "API access", "Unlimited users", "Dedicated account manager"],
  },
];

const FAQS = [
  { q: "How is Taban different from OpenMRS, CommCare, or DHIS2?", a: "Those are excellent tools built for different contexts. OpenMRS requires servers and reliable internet. CommCare charges $200-500/user/month. DHIS2 is free but 67% of facilities can't use it. Taban is browser-based, runs 100% offline, uses photo IDs for illiterate populations, and was designed specifically for fragile-state constraints. We don't replace DHIS2 — we feed it." },
  { q: "Does it really work without internet?", a: "Yes. Every feature — patient records, consultations, lab orders, prescriptions, referrals, AI diagnosis — works completely offline using PouchDB local storage. When connectivity returns, data syncs automatically via CouchDB. Zero data loss, zero dependency on internet for clinical workflows." },
  { q: "How do you handle patient identification without national IDs?", a: "We use a geocode-based ID system: BOMA-{code}-HH{number}. Each patient is identified by their village (boma) and household number. Combined with photo-based identification, this uniquely identifies patients even where multiple people share the same name." },
  { q: "What about data security and patient privacy?", a: "Role-based access control with 11 distinct roles, JWT authentication, bcrypt password hashing, rate limiting, audit logging, and Content Security Policy headers. Patient data stays on-device until sync. We're building toward end-to-end encryption for all stored data." },
  { q: "How long does implementation take?", a: "Typically 3-4 weeks from contract to go-live. Week 1: assessment and configuration. Week 2: staff training. Week 3: deployment and data migration. We provide ongoing support after launch." },
  { q: "Can we try it before purchasing?", a: "Absolutely. Request a demo above and we'll give you a 30-minute personalized walkthrough. We also offer a 14-day free trial for qualified organizations." },
  { q: "What if the government doesn't endorse it?", a: "Our Phase 3 targets private hospitals and NGO programs, which operate independently of government adoption. MSF, WHO, and UNICEF run hundreds of health programs in South Sudan and need exactly this tool. Government adoption accelerates scale, but isn't a prerequisite for revenue." },
];

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

:root {
  --blue: #0077D7;
  --blue-hover: #005FBC;
  --blue-dark: #0A3D6B;
  --blue-mid: #0A5FC2;
  --blue-light: #DFF2FF;
  --blue-pale: #F7FBFF;

  --text: #1D1D1D;
  --text-secondary: #666666;
  --text-muted: #838383;

  --bg: #FFFFFF;
  --bg-subtle: #F7F7F7;
  --bg-muted: #EFEFEF;

  --border: #D3D3D3;
  --border-subtle: #E8E8E8;

  --radius: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.07);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.1);

  --font-display: 'Space Grotesk', 'DM Sans', Helvetica, Arial, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', 'DM Sans', Helvetica, Arial, sans-serif;
  --font-accent: 'DM Sans', 'Inter', Helvetica, Arial, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 18px;
  line-height: 1.7;
  font-weight: 400;
}
a { color: inherit; text-decoration: none; }

/* ── Container ── */
.tb-container { max-width: calc(100% - 64px); margin: 0 auto; padding: 0; }
@media (min-width: 1200px) { .tb-container { max-width: 1200px; } }
@media (min-width: 1400px) { .tb-container { max-width: 1280px; } }

/* ── Reveal Animation ── */
.tb-reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.tb-reveal--visible { opacity: 1; transform: translateY(0); }

/* ── Section Headers ── */
.tb-section-header { text-align: center; max-width: 780px; margin: 0 auto 60px; }
.tb-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-accent); font-size: 12px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase; color: var(--blue);
  margin-bottom: 18px;
}
.tb-eyebrow--light { color: rgba(255,255,255,0.5); }
.tb-heading {
  font-family: var(--font-display); font-size: clamp(32px, 5vw, 58px);
  font-weight: 700; line-height: 1.08; color: var(--text);
  letter-spacing: -0.025em; margin-bottom: 22px;
}
.tb-heading em {
  font-style: normal; font-weight: 700;
  color: var(--blue);
}
.tb-heading--light { color: #fff; }
.tb-heading--light em { color: rgba(255,255,255,0.6); }
.tb-lead { font-size: 17px; line-height: 1.8; color: var(--text-secondary); max-width: 640px; margin: 0 auto; font-weight: 400; }
.tb-check { color: var(--blue); flex-shrink: 0; }

/* ── Buttons — ModMed style: sharp, clean, 2px radius ── */
.tb-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
  border-radius: 2px; font-family: var(--font-body); font-size: 16px;
  font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;
  text-decoration: none; justify-content: center; white-space: nowrap;
  line-height: 1.125;
}
.tb-btn--primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.tb-btn--primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); }
.tb-btn--hero { background: var(--blue); color: #fff; border-color: var(--blue); padding: 16px 36px; font-size: 18px; }
.tb-btn--hero:hover { background: var(--blue-hover); border-color: var(--blue-hover); }
.tb-btn--hero-outline {
  background: transparent; color: #fff; padding: 16px 36px; font-size: 18px;
  border: 2px solid rgba(255,255,255,0.4);
}
.tb-btn--hero-outline:hover { border-color: #fff; background: rgba(255,255,255,0.06); }
.tb-btn--outline { background: transparent; color: var(--text); border: 2px solid var(--border); }
.tb-btn--outline:hover { border-color: var(--blue); color: var(--blue); }
.tb-btn--ghost { background: transparent; color: var(--text-secondary); border: none; font-size: 14px; padding: 8px 18px; }
.tb-btn--ghost:hover { color: var(--text); }
.tb-btn--card { background: transparent; border: 2px solid; width: 100%; }
.tb-btn--card:hover { opacity: 0.8; }
.tb-btn--cta { background: #fff; color: var(--blue); padding: 16px 36px; font-size: 18px; border-color: #fff; }
.tb-btn--cta:hover { background: var(--bg-subtle); }
.tb-btn--cta-outline {
  background: transparent; color: #fff; padding: 14px 32px; font-size: 17px;
  border: 2px solid rgba(255,255,255,0.4);
}
.tb-btn--cta-outline:hover { border-color: #fff; }

/* ── Header — white text by default (on blue hero), dark when scrolled ── */
.tb-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 18px 0; transition: all 0.3s ease;
}
.tb-header .tb-logo__text { color: #fff; }
.tb-header .tb-nav__link { color: rgba(255,255,255,0.75); }
.tb-header .tb-nav__link:hover { color: #fff; }
.tb-header .tb-btn--ghost { color: rgba(255,255,255,0.85); }
.tb-header .tb-btn--ghost:hover { color: #fff; background: rgba(255,255,255,0.1); }
.tb-header .tb-btn--primary { background: #fff; color: var(--blue); border-color: #fff; }
.tb-header .tb-btn--primary:hover { background: rgba(255,255,255,0.9); }
.tb-header .tb-mobile-toggle { color: #fff; }

.tb-header--scrolled {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 0 var(--border-subtle); padding: 12px 0;
}
.tb-header--scrolled .tb-logo__text { color: var(--text); }
.tb-header--scrolled .tb-nav__link { color: var(--text-secondary); }
.tb-header--scrolled .tb-nav__link:hover { color: var(--text); }
.tb-header--scrolled .tb-btn--ghost { color: var(--text-secondary); }
.tb-header--scrolled .tb-btn--ghost:hover { color: var(--text); background: var(--bg-muted); }
.tb-header--scrolled .tb-btn--primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.tb-header--scrolled .tb-btn--primary:hover { background: var(--blue-hover); }
.tb-header--scrolled .tb-mobile-toggle { color: var(--text); }

.tb-header__inner { display: flex; align-items: center; gap: 12px; }
.tb-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.tb-logo__text {
  font-family: var(--font-display); font-size: 20px; font-weight: 700;
  letter-spacing: 0.06em; transition: color 0.3s;
}
.tb-nav { display: flex; gap: 0; margin-left: auto; }
.tb-nav__link {
  background: none; border: none; font-family: var(--font-accent); font-size: 14px;
  font-weight: 500; padding: 8px 18px;
  border-radius: 0; cursor: pointer; transition: color 0.2s;
}
.tb-header__actions { display: flex; gap: 8px; margin-left: 16px; }
.tb-mobile-toggle { display: none; background: none; border: none; cursor: pointer; padding: 8px; transition: color 0.3s; }
.tb-mobile-nav {
  display: flex; flex-direction: column; gap: 4px; padding: 16px 32px 24px;
  background: #fff; border-top: 1px solid var(--border-subtle);
}
.tb-mobile-nav__link {
  background: none; border: none; font-family: var(--font-body); font-size: 16px;
  font-weight: 500; color: var(--text); padding: 14px 0; cursor: pointer;
  text-align: left; border-bottom: 1px solid var(--border-subtle);
}
@media (max-width: 768px) {
  .tb-nav, .tb-header__actions { display: none; }
  .tb-mobile-toggle { display: block; margin-left: auto; }
}

/* ── Hero ── */
.tb-hero {
  position: relative; min-height: 100vh; display: flex; align-items: center;
  padding: 140px 0 100px; overflow: hidden;
  background: var(--blue);
}
.tb-hero__mesh {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.1) 100%);
}
.tb-hero__layout {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center;
}
.tb-hero__content {
  display: flex; flex-direction: column; justify-content: center; gap: 0;
}
.tb-hero__title {
  font-family: var(--font-display); font-size: clamp(36px, 4vw, 56px);
  font-weight: 700; line-height: 1.1; color: #fff;
  letter-spacing: -0.025em; margin-bottom: 18px;
  animation: heroFade 0.8s ease 0.1s both;
}
.tb-hero__title--gradient {
  color: rgba(255,255,255,0.6);
  font-weight: 400;
}
.tb-hero__subtitle {
  font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.7);
  margin-bottom: 28px; max-width: 480px;
  animation: heroFade 0.8s ease 0.2s both;
}
.tb-hero__ctas {
  display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 0;
  animation: heroFade 0.8s ease 0.3s both;
}
.tb-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  animation: heroFade 0.8s ease 0.25s both;
}
.tb-hero__stat-card {
  background: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.tb-hero__stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
.tb-hero__stat-icon {
  color: var(--blue);
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.tb-hero__stat-value {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: var(--blue);
  margin-bottom: 2px;
}
.tb-hero__stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1D1D1D;
  line-height: 1.3;
}
.tb-hero__trust { margin-top: 32px; animation: heroFade 0.8s ease 0.5s both; }
.tb-hero__trust-logos { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.tb-trust-item { opacity: 0.85; transition: opacity 0.2s; }
.tb-trust-item:hover { opacity: 1; }
.tb-trust-item--badge {
  font-size: 11px; font-weight: 700; color: #fff;
  padding: 5px 12px; border: 1px solid rgba(255,255,255,0.35);
  border-radius: 4px; background: rgba(255,255,255,0.15);
}

/* Hero Visual — right column */
.tb-hero__visual {
  position: relative;
  animation: heroFloat 1s ease 0.2s both;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tb-hero__dashboard {
  width: 110%;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.1);
  background: #fff;
  position: relative;
  transform-origin: center left;
}
.tb-hero__dashboard::after { display: none; }
.tb-hero__dashboard-img { width: 100%; display: block; }

@media (max-width: 1024px) {
  .tb-hero__layout { grid-template-columns: 1fr; gap: 40px; }
  .tb-hero__visual { max-width: 560px; margin: 0 auto; }
  .tb-hero__dashboard { width: 100%; }
  .tb-hero__content { max-width: 100%; text-align: center; align-items: center; }
  .tb-hero__stats { max-width: 480px; margin-left: auto; margin-right: auto; }
  .tb-hero__ctas { justify-content: center; }
  .tb-hero__trust-logos { justify-content: center; }
}
@media (max-width: 700px) {
  .tb-hero { padding: 120px 0 72px; }
  .tb-hero__stats { grid-template-columns: 1fr; max-width: 320px; }
  .tb-hero__title { font-size: clamp(28px, 7vw, 40px); }
}

/* ── Social Proof Ticker ── */
.tb-ticker {
  padding: 72px 0; background: var(--bg);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.tb-ticker__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
.tb-ticker__value {
  font-family: 'Space Grotesk', var(--font-display); font-size: 42px; font-weight: 700;
  color: var(--blue); letter-spacing: -0.02em; line-height: 1;
}
.tb-ticker__label {
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px;
}
@media (max-width: 600px) { .tb-ticker__grid { grid-template-columns: repeat(2, 1fr); gap: 24px; } }

/* ── Problem ── */
.tb-problem { padding: 112px 0; background: var(--bg-subtle); }
.tb-problem__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.tb-stat-card {
  background: #fff; border-radius: var(--radius-lg); padding: 28px 24px;
  border: 1px solid var(--border); transition: all 0.25s ease;
  position: relative; overflow: hidden;
  box-shadow: var(--shadow-xs);
}
.tb-stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%;
  background: var(--border);
  transition: background 0.25s;
}
.tb-stat-card:hover { box-shadow: var(--shadow-md); }
.tb-stat-card:hover::before { background: var(--blue); }
.tb-stat-card__top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.tb-stat-card__number { font-family: 'Space Grotesk', var(--font-display); font-size: 40px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
.tb-stat-card__dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 8px; }
.tb-stat-card__label { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.tb-stat-card__desc { font-size: 14px; color: var(--text-secondary); line-height: 1.65; }
@media (max-width: 900px) { .tb-problem__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .tb-problem__grid { grid-template-columns: 1fr; } }

/* ── Features ── */
.tb-features { padding: 112px 0; background: var(--bg); }
.tb-features__layout { display: grid; grid-template-columns: 240px 1fr; gap: 32px; margin-top: 0; }
.tb-features__tabs { display: flex; flex-direction: column; gap: 2px; }
.tb-features__tab {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-radius: 10px; border: none; background: transparent;
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
  text-align: left; position: relative;
}
.tb-features__tab:hover { background: rgba(0,0,0,0.03); color: var(--text); }
.tb-features__tab--active {
  background: #fff; color: var(--blue); font-weight: 600;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xs);
}
.tb-features__tab-arrow { margin-left: auto; opacity: 0.5; }
.tb-features__panel {
  background: #fff; border-radius: var(--radius-lg); padding: 40px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.tb-features__panel-header { display: flex; gap: 20px; margin-bottom: 28px; }
.tb-features__panel-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tb-features__panel-title { font-family: var(--font-display); font-size: 22px; font-weight: 500; margin-bottom: 8px; }
.tb-features__panel-desc { font-size: 15px; line-height: 1.65; color: var(--text-secondary); }
.tb-features__panel-list {
  list-style: none; display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; margin-bottom: 28px;
}
.tb-features__panel-list li {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--text);
}

/* Feature Mock UI */
.tb-features__mock { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
.tb-features__mock-bar {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  background: var(--bg-subtle); border-bottom: 1px solid var(--border-subtle);
}
.tb-features__mock-dots { display: flex; gap: 5px; }
.tb-features__mock-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--border);
}
.tb-features__mock-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.tb-features__mock-body { padding: 12px; display: flex; flex-direction: column; gap: 6px; background: #fff; }
.tb-features__mock-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: var(--bg-subtle); border-radius: 8px;
  animation: mockSlide 0.4s ease both;
}
.tb-features__mock-indicator { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.tb-features__mock-text { font-size: 13px; font-weight: 500; color: var(--text); flex: 1; }
.tb-features__mock-tag {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
@media (max-width: 800px) {
  .tb-features__layout { grid-template-columns: 1fr; }
  .tb-features__tabs { flex-direction: row; overflow-x: auto; gap: 4px; padding-bottom: 8px; }
  .tb-features__tab { white-space: nowrap; }
  .tb-features__tab-arrow { display: none; }
  .tb-features__panel-list { grid-template-columns: 1fr; }
}

/* ── How It Works ── */
.tb-how { padding: 112px 0; background: var(--bg-subtle); }
.tb-how__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 0; }
.tb-how__step { display: flex; flex-direction: column; align-items: center; text-align: center; }
.tb-how__step-connector { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; position: relative; }
.tb-how__step-num {
  font-family: var(--font-display); font-size: 13px; font-weight: 700;
  color: var(--blue); background: var(--blue-light);
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.tb-how__step-line {
  position: absolute; top: 50%; left: calc(100% + 8px);
  width: calc(100% - 16px); height: 1px; background: var(--border);
  display: none;
}
.tb-how__step-body { flex: 1; }
.tb-how__step-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  box-shadow: var(--shadow-sm);
}
.tb-how__step-title { font-family: var(--font-display); font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.tb-how__step-desc { font-size: 14px; line-height: 1.65; color: var(--text-secondary); margin-bottom: 14px; }
.tb-how__step-time {
  display: inline-block; padding: 4px 14px; border-radius: 100px;
  font-size: 12px; font-weight: 600; color: var(--blue);
  background: var(--blue-light);
}
@media (max-width: 900px) { .tb-how__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .tb-how__grid { grid-template-columns: 1fr; } }

/* ── Solutions ── */
.tb-solutions { padding: 112px 0; background: var(--bg); }
.tb-solutions__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 0; }
.tb-solutions__card {
  background: #fff; border-radius: var(--radius-lg); overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}
.tb-solutions__card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.tb-solutions__card-top { padding: 32px 28px 24px; }
.tb-solutions__card-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.tb-solutions__card-title { font-family: var(--font-display); font-size: 22px; font-weight: 500; margin-bottom: 10px; }
.tb-solutions__card-desc { font-size: 14px; line-height: 1.65; color: var(--text-secondary); }
.tb-solutions__card-bottom { padding: 0 28px 28px; }
.tb-solutions__card-features { list-style: none; margin-bottom: 20px; }
.tb-solutions__card-features li {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; padding: 5px 0; color: var(--text);
}
.tb-solutions__card-price { margin-bottom: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle); }
.tb-solutions__card-from { font-size: 12px; color: var(--text-muted); display: block; }
.tb-solutions__card-amount { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
@media (max-width: 900px) { .tb-solutions__grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; } }

/* ── Challenges ── */
.tb-challenges { padding: 112px 0; background: var(--bg-subtle); }
.tb-challenges__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 0; }
.tb-challenges__card {
  background: var(--bg); border-radius: var(--radius-lg); padding: 28px;
  border: 1px solid var(--border); transition: all 0.25s ease;
  box-shadow: var(--shadow-xs);
}
.tb-challenges__card:hover { border-color: var(--blue); box-shadow: var(--shadow-md); }
.tb-challenges__card-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.tb-challenges__card-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; margin-bottom: 10px; }
.tb-challenges__card-solution { font-size: 14px; line-height: 1.65; color: var(--text-secondary); }
@media (max-width: 900px) { .tb-challenges__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .tb-challenges__grid { grid-template-columns: 1fr; } }

/* ── Pricing ── */
.tb-pricing { padding: 112px 0; background: var(--bg); }
.tb-pricing__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 0; align-items: start; }
.tb-pricing__card {
  background: #fff; border-radius: var(--radius-lg); padding: 36px;
  border: 1px solid var(--border); position: relative; transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}
.tb-pricing__card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.tb-pricing__card--featured {
  border-color: var(--blue); box-shadow: var(--shadow-md);
}
.tb-pricing__card--featured:hover { box-shadow: var(--shadow-xl); transform: translateY(-3px); }
.tb-pricing__badge {
  position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
  padding: 5px 16px; border-radius: 100px; font-size: 12px; font-weight: 700;
  background: var(--blue); color: #fff; letter-spacing: 0.3px;
}
.tb-pricing__name { font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.tb-pricing__target { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
.tb-pricing__amount { margin-bottom: 24px; display: flex; align-items: baseline; gap: 2px; }
.tb-pricing__currency { font-size: 20px; color: var(--text); font-weight: 700; }
.tb-pricing__number { font-family: var(--font-display); font-size: 48px; font-weight: 300; line-height: 1; letter-spacing: -0.01em; }
.tb-pricing__period { font-size: 14px; color: var(--text-muted); margin-left: 2px; }
.tb-pricing__divider { height: 1px; background: var(--border-subtle); margin-bottom: 24px; }
.tb-pricing__features { list-style: none; margin-bottom: 28px; }
.tb-pricing__features li {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 14px; padding: 5px 0; color: var(--text);
}
.tb-pricing__note { text-align: center; font-size: 14px; color: var(--text-muted); margin-top: 32px; }
@media (max-width: 900px) {
  .tb-pricing__grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; }
  .tb-pricing__card--featured { transform: none; }
}

/* ── Demo ── */
.tb-demo {
  padding: 120px 0;
  background: #0F172A;
}
.tb-demo__layout { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.tb-demo__desc { font-size: 16px; line-height: 1.75; color: rgba(255,255,255,0.55); margin-bottom: 32px; }
.tb-demo__perks { display: flex; flex-direction: column; gap: 14px; }
.tb-demo__perk { display: flex; align-items: center; gap: 10px; font-size: 15px; color: rgba(255,255,255,0.75); }
.tb-demo__perk svg { color: var(--blue); flex-shrink: 0; }
.tb-demo__form-wrap {
  background: #fff; border-radius: var(--radius-lg); padding: 36px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
.tb-demo__form { display: flex; flex-direction: column; gap: 16px; }
.tb-demo__form-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 2px; }
.tb-demo__form-sub { font-size: 14px; color: var(--text-secondary); margin-bottom: 4px; }
.tb-demo__success { text-align: center; padding: 40px 20px; }
.tb-demo__success-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(0,119,215,0.08); color: var(--blue);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.tb-demo__success h3 { font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 12px; }
.tb-demo__success p { font-size: 15px; color: var(--text-secondary); line-height: 1.6; }
.tb-demo__success-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.tb-demo__error {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--blue-dark);
  background: rgba(10,61,107,0.08);
  border: 1px solid rgba(248,113,113,0.3);
}
.tb-field__label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.tb-field__input {
  width: 100%; padding: 12px 14px; border-radius: 2px;
  border: 1px solid var(--border);
  font-family: var(--font-body); font-size: 15px; color: var(--text);
  background: #fff; transition: border-color 0.2s; outline: none;
}
.tb-field__input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,119,215,0.1); }
.tb-field__input--error { border-color: var(--blue-dark); }
.tb-field__error { font-size: 12px; color: var(--blue-dark); margin-top: 4px; display: block; }
select.tb-field__input { cursor: pointer; }
textarea.tb-field__input { resize: vertical; }
@media (max-width: 800px) { .tb-demo__layout { grid-template-columns: 1fr; } }

/* ── FAQ ── */
.tb-faq { padding: 96px 0; background: var(--bg-subtle); }
.tb-faq__list { max-width: 720px; margin: 0 auto; }
.tb-faq__item { border-bottom: 1px solid var(--border); }
.tb-faq__question {
  display: flex; justify-content: space-between; align-items: center; width: 100%;
  padding: 20px 0; background: none; border: none; cursor: pointer;
  font-family: var(--font-body); font-size: 16px; font-weight: 600;
  color: var(--text); text-align: left; gap: 16px; transition: color 0.15s;
}
.tb-faq__question:hover { color: var(--blue); }
.tb-faq__question svg { flex-shrink: 0; color: var(--text-muted); }
.tb-faq__answer {
  font-size: 15px; line-height: 1.7; color: var(--text-secondary);
  padding: 0 0 20px; animation: fadeIn 0.3s ease;
}
.tb-faq__item--open .tb-faq__question { color: var(--blue); }

/* ── CTA ── */
.tb-cta {
  padding: 120px 0;
  background: var(--blue);
  text-align: center;
}
.tb-cta__title {
  font-family: var(--font-display); font-size: clamp(28px, 3.8vw, 42px);
  font-weight: 700; line-height: 1.2; color: #fff; margin-bottom: 16px;
  letter-spacing: -0.02em;
}
.tb-cta__title em {
  font-style: normal; font-weight: 400; color: rgba(255,255,255,0.6);
}
.tb-cta__desc { font-size: 17px; color: rgba(255,255,255,0.7); margin-bottom: 36px; }
.tb-cta__buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

/* ── Footer ── */
.tb-footer { background: #0F172A; padding: 64px 0 32px; color: rgba(255,255,255,0.5); }
.tb-footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.tb-footer__tagline { font-size: 14px; line-height: 1.65; margin-bottom: 12px; }
.tb-footer__built { font-size: 13px; font-weight: 600; color: var(--blue); }
.tb-footer__col h4 {
  font-family: var(--font-display); font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.8); margin-bottom: 16px;
}
.tb-footer__col button, .tb-footer__col a {
  display: block; background: none; border: none; font-family: var(--font-body);
  font-size: 14px; color: rgba(255,255,255,0.4); padding: 4px 0; cursor: pointer;
  text-decoration: none; transition: color 0.15s;
}
.tb-footer__col button:hover, .tb-footer__col a:hover { color: rgba(255,255,255,0.9); }
.tb-footer__contact { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 10px; }
.tb-footer__bottom {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;
}
.tb-footer__bottom p { font-size: 13px; }
.tb-footer__badges { display: flex; gap: 16px; }
.tb-footer__badges span {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.3);
}
@media (max-width: 800px) {
  .tb-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .tb-footer__bottom { flex-direction: column; gap: 12px; text-align: center; }
}
@media (max-width: 500px) { .tb-footer__grid { grid-template-columns: 1fr; } }

/* ── Demo Modal Popup ── */
.tb-modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: fadeIn 0.15s ease;
}
.tb-modal-panel {
  background: #fff; border-radius: var(--radius-xl); padding: 32px;
  width: 100%; max-width: min(480px, calc(100vw - 48px));
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1);
  position: relative;
  animation: heroFade 0.2s ease;
}
.tb-modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border-radius: 4px;
  background: var(--bg-muted); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); transition: background 0.15s;
}
.tb-modal-close:hover { background: var(--border); }

/* ── Animations ── */
@keyframes heroFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes heroFloat { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mockSlide { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
`;
