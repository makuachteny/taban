// ============================================
// Performance Color Scales (WHO-style red→yellow→green)
// ============================================

/** Discrete 4-stop color: red(<40), amber(40-59), yellow(60-79), green(80+) */
export function getPerformanceColor(value: number): string {
  if (value < 40) return '#EF4444';   // red
  if (value < 60) return '#F59E0B';   // amber
  if (value < 80) return '#EAB308';   // yellow
  return '#3ECF8E';                    // green
}

/** Smooth RGB gradient: red(0) → yellow(50) → green(100) */
export function getMetricColorInterpolated(value: number): string {
  const v = Math.max(0, Math.min(100, value));
  let r: number, g: number, b: number;
  if (v <= 50) {
    // red → yellow
    const t = v / 50;
    r = 239;
    g = Math.round(68 + t * (163 - 68));
    b = Math.round(68 - t * 57);
  } else {
    // yellow → green
    const t = (v - 50) / 50;
    r = Math.round(234 - t * (234 - 34));
    g = Math.round(179 + t * (197 - 179));
    b = Math.round(8 + t * (86 - 8));
  }
  return `rgb(${r},${g},${b})`;
}

/** Background tint at 14% opacity for metric cards */
export function getPerformanceBg(value: number): string {
  if (value < 40) return 'rgba(239,68,68,0.12)';
  if (value < 60) return 'rgba(245,158,11,0.12)';
  if (value < 80) return 'rgba(234,179,8,0.10)';
  return 'rgba(34,197,94,0.12)';
}

export type PerformanceMetricKey = keyof typeof METRIC_LABELS;

/** Human-readable labels for each performance metric key */
export const METRIC_LABELS = {
  reportingCompleteness: 'Reporting',
  serviceReadinessScore: 'Readiness',
  tracerMedicineAvailability: 'Medicines',
  staffingScore: 'Staffing',
  opdVisitsPerMonth: 'OPD Visits',
  ancCoverage: 'ANC Coverage',
  immunizationCoverage: 'EPI Coverage',
  stockOutDays: 'Stock-out Days',
  qualityScore: 'Quality',
} as const;
