'use client';

import {
  Stethoscope, FlaskConical, Pill, Syringe, ArrowRightLeft, HeartPulse,
  FileText, Activity,
} from 'lucide-react';
import type {
  MedicalRecordDoc, LabResultDoc, PrescriptionDoc, ImmunizationDoc,
  ReferralDoc, ANCVisitDoc, AppointmentDoc, TriageDoc,
} from '@/lib/db-types';

/**
 * Patient 360 timeline — merges every encounter type into a single
 * chronological feed so a clinician can see the patient's full journey
 * without flipping between tabs.
 *
 * Each input list is optional: pass only what you have. The component
 * normalises every record into a TimelineEvent and renders them sorted
 * newest-first.
 */
export interface PatientTimelineProps {
  medicalRecords?: MedicalRecordDoc[];
  labResults?: LabResultDoc[];
  prescriptions?: PrescriptionDoc[];
  immunizations?: ImmunizationDoc[];
  referrals?: ReferralDoc[];
  ancVisits?: ANCVisitDoc[];
  appointments?: AppointmentDoc[];
  triages?: TriageDoc[];
}

interface TimelineEvent {
  id: string;
  date: string;            // ISO or YYYY-MM-DD
  category: 'triage' | 'consultation' | 'lab' | 'prescription' | 'immunization' | 'referral' | 'anc' | 'appointment';
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; bg: string; color: string };
}

const CATEGORY_CONFIG: Record<TimelineEvent['category'], { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string; label: string }> = {
  triage:        { icon: Activity,       color: '#FB923C',               bg: 'rgba(251,146,60,0.14)', label: 'Triage' },
  consultation:  { icon: Stethoscope,    color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)', label: 'Consultation' },
  lab:           { icon: FlaskConical,   color: '#7C3AED',               bg: 'rgba(124,58,237,0.12)', label: 'Lab' },
  prescription:  { icon: Pill,           color: '#0D9488',               bg: 'rgba(13,148,136,0.12)', label: 'Rx' },
  immunization:  { icon: Syringe,        color: '#059669',               bg: 'rgba(5,150,105,0.12)',  label: 'Vaccine' },
  referral:      { icon: ArrowRightLeft, color: '#F59E0B',               bg: 'rgba(245,158,11,0.12)', label: 'Referral' },
  anc:           { icon: HeartPulse,     color: '#EC4899',               bg: 'rgba(236,72,153,0.12)', label: 'ANC' },
  appointment:   { icon: FileText,       color: '#6366F1',               bg: 'rgba(99,102,241,0.12)', label: 'Appointment' },
};

function buildEvents(props: PatientTimelineProps): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const t of props.triages || []) {
    const vitals: string[] = [];
    if (t.temperature) vitals.push(`T ${t.temperature}°C`);
    if (t.pulse) vitals.push(`HR ${t.pulse}`);
    if (t.respiratoryRate) vitals.push(`RR ${t.respiratoryRate}`);
    if (t.oxygenSaturation) vitals.push(`SpO₂ ${t.oxygenSaturation}%`);
    if (t.systolic && t.diastolic) vitals.push(`BP ${t.systolic}/${t.diastolic}`);
    events.push({
      id: `triage-${t._id}`,
      date: t.triagedAt || t.createdAt,
      category: 'triage',
      title: t.chiefComplaint || `${t.priority} triage`,
      subtitle: `A: ${t.airway} · B: ${t.breathing} · C: ${t.circulation} · AVPU-${t.consciousness.toUpperCase()[0]}`,
      meta: `${t.triagedByName}${vitals.length ? ' · ' + vitals.join(' · ') : ''}`,
      badge: t.priority === 'RED'
        ? { label: 'RED', bg: 'rgba(229,46,66,0.14)', color: 'var(--color-danger)' }
        : t.priority === 'YELLOW'
        ? { label: 'YELLOW', bg: 'rgba(252,211,77,0.14)', color: 'var(--color-warning)' }
        : { label: 'GREEN', bg: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' },
    });
  }

  for (const r of props.medicalRecords || []) {
    const dx = (r.diagnoses || []).slice(0, 2).map(d => d.name).join(', ');
    events.push({
      id: `mr-${r._id}`,
      date: r.consultedAt || r.visitDate || r.createdAt,
      category: 'consultation',
      title: r.chiefComplaint || 'Clinical consultation',
      subtitle: dx || r.providerName || undefined,
      meta: r.providerName ? `${r.providerName}${r.department ? ` · ${r.department}` : ''}` : r.department,
      badge: r.visitType ? { label: r.visitType, bg: 'rgba(43,111,224,0.10)', color: 'var(--accent-primary)' } : undefined,
    });
  }

  for (const lr of props.labResults || []) {
    const status = lr.status === 'completed' ? lr.result || 'completed' : lr.status.replace('_', ' ');
    events.push({
      id: `lab-${lr._id}`,
      date: lr.completedAt || lr.orderedAt || lr.createdAt,
      category: 'lab',
      title: lr.testName,
      subtitle: status,
      meta: lr.specimen ? `Specimen: ${lr.specimen}` : undefined,
      badge: lr.critical
        ? { label: 'CRITICAL', bg: 'rgba(229,46,66,0.14)', color: 'var(--color-danger)' }
        : lr.abnormal
        ? { label: 'Abnormal', bg: 'rgba(252,211,77,0.14)', color: 'var(--color-warning)' }
        : undefined,
    });
  }

  for (const rx of props.prescriptions || []) {
    events.push({
      id: `rx-${rx._id}`,
      date: rx.createdAt,
      category: 'prescription',
      title: rx.medication,
      subtitle: `${rx.dose || ''} ${rx.frequency || ''}${rx.duration ? ` · ${rx.duration}` : ''}`.trim(),
      meta: rx.prescribedBy,
      badge: rx.status === 'dispensed'
        ? { label: 'Dispensed', bg: 'rgba(16,185,129,0.14)', color: 'var(--color-success)' }
        : { label: 'Pending', bg: 'rgba(252,211,77,0.14)', color: 'var(--color-warning)' },
    });
  }

  for (const im of props.immunizations || []) {
    events.push({
      id: `imm-${im._id}`,
      date: im.dateGiven || im.createdAt,
      category: 'immunization',
      title: `${im.vaccine} ${im.doseNumber > 0 ? `dose ${im.doseNumber}` : ''}`.trim(),
      subtitle: im.batchNumber ? `Batch ${im.batchNumber}` : undefined,
      meta: im.facilityName,
    });
  }

  for (const ref of props.referrals || []) {
    events.push({
      id: `ref-${ref._id}`,
      date: ref.referralDate || ref.createdAt,
      category: 'referral',
      title: `Referred to ${ref.toHospital || 'facility'}`,
      subtitle: ref.reason || ref.department,
      meta: ref.referringDoctor,
      badge: { label: ref.status, bg: 'rgba(245,158,11,0.10)', color: 'var(--color-warning)' },
    });
  }

  for (const a of props.ancVisits || []) {
    events.push({
      id: `anc-${a._id}`,
      date: a.visitDate || a.createdAt,
      category: 'anc',
      title: `ANC visit ${a.visitNumber}`,
      subtitle: `Gestational age ${a.gestationalAge || '—'}w · Risk: ${a.riskLevel}`,
      meta: a.facilityName,
      badge: a.riskLevel === 'high'
        ? { label: 'HIGH RISK', bg: 'rgba(229,46,66,0.14)', color: 'var(--color-danger)' }
        : a.riskLevel === 'moderate'
        ? { label: 'Moderate', bg: 'rgba(252,211,77,0.14)', color: 'var(--color-warning)' }
        : undefined,
    });
  }

  for (const ap of props.appointments || []) {
    events.push({
      id: `apt-${ap._id}`,
      date: `${ap.appointmentDate}T${ap.appointmentTime || '00:00'}`,
      category: 'appointment',
      title: ap.appointmentType?.replace(/_/g, ' ') || 'Appointment',
      subtitle: ap.reason,
      meta: ap.providerName,
      badge: { label: ap.status, bg: 'rgba(99,102,241,0.10)', color: '#6366F1' },
    });
  }

  return events
    .filter(e => !!e.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function PatientTimeline(props: PatientTimelineProps) {
  const events = buildEvents(props);

  if (events.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No clinical events recorded for this patient yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="relative pl-6">
        {/* Vertical guide line */}
        <div
          className="absolute left-[15px] top-2 bottom-2 w-px"
          style={{ background: 'var(--border-light)' }}
        />
        {events.map(e => {
          const cfg = CATEGORY_CONFIG[e.category];
          const Icon = cfg.icon;
          const dateLabel = (() => {
            try {
              return new Date(e.date).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                ...(e.date.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
              });
            } catch { return e.date; }
          })();
          return (
            <div key={e.id} className="relative mb-5 last:mb-0 pl-6">
              <div
                className="absolute -left-[1px] top-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: cfg.bg, border: '2px solid var(--bg-card-solid)' }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>·</span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{dateLabel}</span>
                    {e.badge && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: e.badge.bg, color: e.badge.color }}>
                        {e.badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {e.title}
                  </p>
                  {e.subtitle && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{e.subtitle}</p>
                  )}
                  {e.meta && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.meta}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
