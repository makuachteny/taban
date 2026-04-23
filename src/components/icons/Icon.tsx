import { forwardRef } from 'react';
import type { CSSProperties, SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';

// Duotone icon system for Taban EMR.
// Each icon renders a soft-fill "accent" layer + a stroked "primary" layer.
// Props mirror lucide-react so icons are drop-in replacements in nav configs.

export type IconName =
  // Clinical
  | 'chart' | 'patient' | 'stethoscope' | 'referral' | 'message'
  | 'calendar' | 'timeline' | 'record' | 'consultation' | 'triage'
  // Services
  | 'flask' | 'pill' | 'wallet' | 'prescription' | 'claim' | 'receipt'
  | 'creditCard' | 'mobileMoney' | 'diagnosis'
  // Vital events
  | 'vaccine' | 'pregnant' | 'baby' | 'skull' | 'surveillance' | 'mch'
  // Vitals
  | 'heart' | 'bloodPressure' | 'thermometer' | 'oxygen' | 'lungs'
  | 'weight' | 'pulse'
  // UI
  | 'building' | 'wifi' | 'wifiOff' | 'cloudOff' | 'search' | 'alert'
  | 'chevronLeft' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'qr' | 'phone' | 'mapPin' | 'clock' | 'edit' | 'printer' | 'download'
  | 'shield' | 'sparkle' | 'check' | 'close' | 'menu' | 'bell'
  | 'moon' | 'sun' | 'globe' | 'settings' | 'logout' | 'user' | 'arrowRight'
  | 'arrowRightLeft' | 'plus' | 'video' | 'bug' | 'activity' | 'server'
  | 'barChart' | 'palette' | 'users' | 'gauge' | 'layoutDashboard'
  | 'fileText' | 'home'
  // Extended UI
  | 'apple' | 'archive' | 'arrowDownLeft' | 'arrowDownRight' | 'arrowUpDown'
  | 'arrowUpRight' | 'ban' | 'bandage' | 'banknote' | 'bedDouble' | 'bellOff'
  | 'brain' | 'camera' | 'code' | 'copy' | 'cpu' | 'dollarSign'
  | 'externalLink' | 'eye' | 'eyeOff' | 'fileJson' | 'fileSpreadsheet'
  | 'fileUp' | 'flag' | 'folderOpen' | 'gift' | 'gitBranch' | 'gitCompare'
  | 'hardDrive' | 'helpCircle' | 'history' | 'image' | 'info' | 'keyRound'
  | 'keyboard' | 'languages' | 'layers' | 'lineChart' | 'list' | 'loader'
  | 'lock' | 'logIn' | 'mail' | 'maximize' | 'mic' | 'micOff' | 'microscope'
  | 'minus' | 'monitorSmartphone' | 'moreVertical' | 'navigation' | 'network'
  | 'package' | 'paperclip' | 'pause' | 'phoneOff' | 'pieChart' | 'play'
  | 'radio' | 'refresh' | 'rotate' | 'save' | 'send' | 'sendHorizontal'
  | 'shoppingCart' | 'signal' | 'sliders' | 'square' | 'star' | 'table'
  | 'target' | 'thumbsUp' | 'timer' | 'toggleLeft' | 'toggleRight' | 'trash'
  | 'trendingDown' | 'trendingUp' | 'truck' | 'upload' | 'userX' | 'utensils'
  | 'utensilsCrossed' | 'wind' | 'zap' | 'zapOff';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'ref'> {
  name: IconName;
  size?: number | string;
  color?: string;
  accent?: string;
  strokeWidth?: number | string;
  style?: CSSProperties;
  ref?: React.Ref<SVGSVGElement>;
}

// category accent colors so the library surface picks tasteful defaults
export const CATEGORY_ACCENTS: Record<string, string> = {
  clinical: '#2E9E7E',
  services: '#E4A84B',
  'vital-events': '#D96E59',
  vitals: '#C44536',
  ui: '#5A7370',
};

// ───────────────────────────────────────────────────────────────────────────
// helper renderer — produces a consistent 24×24 duotone SVG
// ───────────────────────────────────────────────────────────────────────────
type Paths = (color: string, accent: string, sw: number | string) => JSX.Element;

function render(
  name: string,
  paths: Paths,
  { name: _iconName, size = 22, color = 'currentColor', accent, strokeWidth = 1.9, style, ref, ...rest }: IconProps,
) {
  const a = accent || color;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      data-icon={name}
      {...rest}
    >
      {paths(color, a, strokeWidth)}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// icon path definitions — each returns <g> of accent-fill + primary-stroke
// ───────────────────────────────────────────────────────────────────────────
const PATHS: Record<IconName, Paths> = {
  // ── Clinical ────────────────────────────────────────────────────────────
  chart: (_c, a) => (
    <>
      <rect x="3" y="10" width="4" height="10" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="10" y="6" width="4" height="14" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="17" y="13" width="4" height="7" rx="1" fill={a} fillOpacity="0.44" />
      <path d="M3 20h18M5 10v10M12 6v14M19 13v7" />
    </>
  ),
  patient: (_c, a) => (
    <>
      <circle cx="12" cy="8" r="4" fill={a} fillOpacity="0.44" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" fill={a} fillOpacity="0.33" />
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  stethoscope: (_c, a) => (
    <>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" fill={a} fillOpacity="0.36" />
      <circle cx="18" cy="15" r="2.5" fill={a} fillOpacity="0.44" />
      <path d="M6 3v6a4 4 0 0 0 8 0V3M6 3H4M14 3h2M10 13v3a5 5 0 0 0 5 5v-3.5" />
      <circle cx="18" cy="15" r="2.5" />
    </>
  ),
  referral: (_c, a) => (
    <>
      <path d="M3 12h14l-4-4M21 12l-4 4" fill="none" />
      <path d="M3 12h14" stroke={a} strokeOpacity="0.64" strokeWidth="6" strokeLinecap="round" />
      <path d="M3 12h18M17 8l4 4-4 4M7 16H3l4-4" />
    </>
  ),
  message: (_c, a) => (
    <>
      <path d="M4 5h16v11H9l-5 4V5z" fill={a} fillOpacity="0.44" />
      <path d="M4 5h16v11H9l-5 4V5z" />
      <path d="M8 10h8M8 13h5" stroke={a} strokeOpacity="0.7" />
    </>
  ),
  calendar: (_c, a) => (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" fill={a} fillOpacity="0.33" />
      <path d="M3 9h18" stroke={a} strokeOpacity="0.85" />
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" />
    </>
  ),
  timeline: (_c, a) => (
    <>
      <circle cx="6" cy="6" r="2.5" fill={a} fillOpacity="0.48" />
      <circle cx="6" cy="18" r="2.5" fill={a} fillOpacity="0.48" />
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M6 8.5v7M11 6h10M11 12h7M11 18h10" />
    </>
  ),
  record: (_c, a) => (
    <>
      <path d="M6 3h9l4 4v14H6z" fill={a} fillOpacity="0.36" />
      <path d="M6 3h9l4 4v14H6zM15 3v4h4" />
      <path d="M9 12h7M9 16h5" stroke={a} strokeOpacity="0.7" />
    </>
  ),
  consultation: (_c, a) => (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M7 9h10M7 13h6" />
      <path d="M8 18v3l4-3" />
    </>
  ),
  triage: (_c, a) => (
    <>
      <path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z" fill={a} fillOpacity="0.39" />
      <path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),

  // ── Services ────────────────────────────────────────────────────────────
  flask: (_c, a) => (
    <>
      <path d="M9 3h6v5l4 9a3 3 0 0 1-2.7 4H7.7A3 3 0 0 1 5 17l4-9V3z" fill={a} fillOpacity="0.39" />
      <path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.7 4h8.6A3 3 0 0 0 19 17l-5-9V3" />
      <path d="M8 14h8" stroke={a} strokeOpacity="0.8" />
    </>
  ),
  pill: (_c, a) => (
    <>
      <rect x="2" y="9" width="20" height="6" rx="3" fill={a} fillOpacity="0.39" transform="rotate(-35 12 12)" />
      <rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-35 12 12)" />
      <path d="M7.2 16.8l9.6-9.6" stroke={a} strokeOpacity="0.8" />
    </>
  ),
  wallet: (_c, a) => (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13l2 3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill={a} fillOpacity="0.36" />
      <path d="M3 7a2 2 0 0 1 2-2h13l2 3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M16 13h3" />
      <circle cx="17" cy="13" r="1.2" fill={a} fillOpacity="0.8" stroke="none" />
    </>
  ),
  prescription: (_c, a) => (
    <>
      <path d="M6 3h7a4 4 0 0 1 0 8H6V3z" fill={a} fillOpacity="0.39" />
      <path d="M6 3h7a4 4 0 0 1 0 8H6V3zM6 11v10M11 11l9 9M15 16l-4 4" />
    </>
  ),
  claim: (_c, a) => (
    <>
      <path d="M5 3h10l4 4v14H5z" fill={a} fillOpacity="0.36" />
      <path d="M5 3h10l4 4v14H5zM15 3v4h4" />
      <path d="M9 14l2 2 4-4" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  receipt: (_c, a) => (
    <>
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z" fill={a} fillOpacity="0.36" />
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={a} strokeOpacity="0.7" />
    </>
  ),
  creditCard: (_c, a) => (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  mobileMoney: (_c, a) => (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" fill={a} fillOpacity="0.36" />
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M10 7h4M12 12v4M10.5 13.5h3M10.5 14.5h3" />
    </>
  ),
  diagnosis: (_c, a) => (
    <>
      <circle cx="11" cy="11" r="7" fill={a} fillOpacity="0.33" />
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
      <path d="M11 8v6M8 11h6" stroke={a} strokeOpacity="0.9" />
    </>
  ),

  // ── Vital events ───────────────────────────────────────────────────────
  vaccine: (_c, a) => (
    <>
      <path d="M14 3l7 7-3 3-3-3-5 5v4H6v-4l5-5-3-3 3-3 3 3z" fill={a} fillOpacity="0.39" />
      <path d="M14 3l7 7M17 6l-3 3M12 8l-6 6v4h4l6-6M9 11l4 4M3 21l3-3" />
    </>
  ),
  pregnant: (_c, a) => (
    <>
      <circle cx="12" cy="6" r="2.5" fill={a} fillOpacity="0.44" />
      <path d="M10 10c-2 1-3 3-3 5 0 3 2 5 5 5s5-2 5-5v-2c0-2-1-3-3-3" fill={a} fillOpacity="0.36" />
      <circle cx="12" cy="6" r="2.5" />
      <path d="M10 10c-2 1-3 3-3 5 0 3 2 5 5 5s5-2 5-5v-2c0-2-1-3-3-3h-4" />
      <circle cx="14" cy="15" r="1" fill={a} fillOpacity="0.7" stroke="none" />
    </>
  ),
  baby: (_c, a) => (
    <>
      <circle cx="12" cy="8" r="5" fill={a} fillOpacity="0.39" />
      <circle cx="12" cy="8" r="5" />
      <path d="M9 8h.5M14.5 8h.5M9.5 10.5c.8.8 2.2.8 3 0" />
      <path d="M7 13v6M17 13v6M10 19c0 1 1 2 2 2s2-1 2-2" />
    </>
  ),
  skull: (_c, a) => (
    <>
      <path d="M5 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2h-1v3H8v-3H7a2 2 0 0 1-2-2v-5z" fill={a} fillOpacity="0.39" />
      <path d="M5 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2h-1v3H8v-3H7a2 2 0 0 1-2-2v-5z" />
      <circle cx="9" cy="11" r="1.5" fill={a} fillOpacity="0.9" stroke="none" />
      <circle cx="15" cy="11" r="1.5" fill={a} fillOpacity="0.9" stroke="none" />
      <path d="M11 16h2" />
    </>
  ),
  surveillance: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.27" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.8" fill={a} fillOpacity="0.9" stroke="none" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </>
  ),
  mch: (_c, a) => (
    <>
      <path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11h-2z" fill={a} fillOpacity="0.39" />
      <path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11h-2z" />
      <path d="M8 10h2l1 2 2-4 1 2h2" />
    </>
  ),

  // ── Vitals ─────────────────────────────────────────────────────────────
  heart: (_c, a) => (
    <>
      <path d="M12 20s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11h-2z" fill={a} fillOpacity="0.44" />
      <path d="M12 20s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11h-2z" />
    </>
  ),
  bloodPressure: (_c, a) => (
    <>
      <rect x="3" y="6" width="14" height="10" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="6" width="14" height="10" rx="2" />
      <path d="M17 11h3M6 11c1-2 3-2 4 0s3 2 4 0" stroke={a} strokeOpacity="0.9" />
      <path d="M7 19h8" />
    </>
  ),
  thermometer: (_c, a) => (
    <>
      <circle cx="12" cy="18" r="3" fill={a} fillOpacity="0.48" />
      <path d="M10 4a2 2 0 1 1 4 0v11a3 3 0 1 1-4 0V4z" fill={a} fillOpacity="0.33" />
      <path d="M10 4a2 2 0 1 1 4 0v11a3 3 0 1 1-4 0V4zM12 9v8" />
    </>
  ),
  oxygen: (_c, a) => (
    <>
      <path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z" fill={a} fillOpacity="0.39" />
      <path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z" />
      <path d="M9 14c0 1.5 1.3 3 3 3" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  lungs: (_c, a) => (
    <>
      <path d="M12 3v9M8 7c-3 2-5 6-5 10 0 2 2 3 4 2l3-2V7c-1-1-1.5-1.5-2-2zM16 7c3 2 5 6 5 10 0 2-2 3-4 2l-3-2V7c1-1 1.5-1.5 2-2z" fill={a} fillOpacity="0.36" />
      <path d="M12 3v9M8 7c-3 2-5 6-5 10 0 2 2 3 4 2l3-2V7c-1-1-1.5-1.5-2-2zM16 7c3 2 5 6 5 10 0 2-2 3-4 2l-3-2V7c1-1 1.5-1.5 2-2z" />
    </>
  ),
  weight: (_c, a) => (
    <>
      <path d="M4 6h16l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6z" fill={a} fillOpacity="0.36" />
      <path d="M4 6h16l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6z" />
      <path d="M9 6a3 3 0 0 1 6 0M12 11v5" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  pulse: (_c, a) => (
    <>
      <path d="M3 12h4l2-5 3 10 2-7 2 3h5" stroke={a} strokeOpacity="0.51" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 12h4l2-5 3 10 2-7 2 3h5" />
    </>
  ),

  // ── UI ─────────────────────────────────────────────────────────────────
  building: (_c, a) => (
    <>
      <path d="M4 21V6l7-3 7 3v15M4 21h14" fill={a} fillOpacity="0.36" />
      <path d="M4 21V6l7-3 7 3v15M3 21h18" />
      <path d="M8 10h2M8 14h2M13 10h2M13 14h2M13 18h2M8 18h2" />
    </>
  ),
  wifi: (_c, a) => (
    <>
      <path d="M2 8c6-5 14-5 20 0M5 12c4-3 10-3 14 0M8 16c2-1 6-1 8 0" stroke={a} strokeOpacity="0.64" strokeWidth="4" strokeLinecap="round" />
      <path d="M2 8c6-5 14-5 20 0M5 12c4-3 10-3 14 0M8 16c2-1 6-1 8 0" />
      <circle cx="12" cy="20" r="1.5" fill={a} stroke="none" />
    </>
  ),
  wifiOff: (_c, a) => (
    <>
      <path d="M5 12c4-3 10-3 14 0M8 16c2-1 6-1 8 0" stroke={a} strokeOpacity="0.64" strokeWidth="3" />
      <path d="M2 8c2-2 4.5-3 7-3.5M15 4.8c2.4.6 4.7 1.7 7 3.2M5 12c1.5-1 3-1.8 4.5-2.2M16 10c1 .4 2 1 3 1.8M8 16c1-.5 2-1 3-1M3 3l18 18" />
      <circle cx="12" cy="20" r="1.5" fill={a} stroke="none" />
    </>
  ),
  cloudOff: (_c, a) => (
    <>
      <path d="M7 19h11a4 4 0 0 0 1-7.8A6 6 0 0 0 8 8" fill={a} fillOpacity="0.36" />
      <path d="M7 19h11a4 4 0 0 0 1-7.8A6 6 0 0 0 8 8M3 3l18 18M7 8a4 4 0 0 0-4 7" />
    </>
  ),
  search: (_c, a) => (
    <>
      <circle cx="11" cy="11" r="7" fill={a} fillOpacity="0.33" />
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  alert: (_c, a) => (
    <>
      <path d="M12 3l10 17H2L12 3z" fill={a} fillOpacity="0.44" />
      <path d="M12 3l10 17H2L12 3z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="1" fill={a} stroke="none" />
    </>
  ),
  chevronLeft: () => <path d="M15 5l-7 7 7 7" />,
  chevronRight: () => <path d="M9 5l7 7-7 7" />,
  chevronDown: () => <path d="M5 9l7 7 7-7" />,
  chevronUp: () => <path d="M5 15l7-7 7 7" />,
  qr: (_c, a) => (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h1v1h-1z" fill={a} stroke="none" />
    </>
  ),
  phone: (_c, a) => (
    <>
      <path d="M5 3h3l2 5-2 2c1 3 3 5 6 6l2-2 5 2v3a2 2 0 0 1-2 2c-8 0-16-8-16-16a2 2 0 0 1 2-2z" fill={a} fillOpacity="0.36" />
      <path d="M5 3h3l2 5-2 2c1 3 3 5 6 6l2-2 5 2v3a2 2 0 0 1-2 2c-8 0-16-8-16-16a2 2 0 0 1 2-2z" />
    </>
  ),
  mapPin: (_c, a) => (
    <>
      <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" fill={a} fillOpacity="0.39" />
      <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" />
      <circle cx="12" cy="9" r="2.5" fill={a} stroke="none" />
    </>
  ),
  clock: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.33" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  edit: (_c, a) => (
    <>
      <path d="M14 4l6 6-11 11H3v-6L14 4z" fill={a} fillOpacity="0.36" />
      <path d="M14 4l6 6-11 11H3v-6L14 4zM13 5l6 6" />
    </>
  ),
  printer: (_c, a) => (
    <>
      <path d="M6 9V3h12v6M6 19H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" fill={a} fillOpacity="0.36" />
      <path d="M6 9V3h12v6M6 19H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </>
  ),
  download: (_c, a) => (
    <>
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill={a} fillOpacity="0.36" />
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M12 3v12M7 11l5 5 5-5" />
    </>
  ),
  shield: (_c, a) => (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" fill={a} fillOpacity="0.44" />
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  sparkle: (_c, a) => (
    <>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill={a} fillOpacity="0.48" />
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
      <path d="M19 15l.7 2.3 2.3.7-2.3.7L19 21l-.7-2.3-2.3-.7 2.3-.7.7-2.3z" fill={a} fillOpacity="0.5" stroke="none" />
    </>
  ),
  check: () => <path d="M4 12l5 5L20 6" />,
  close: () => <path d="M5 5l14 14M19 5L5 19" />,
  menu: () => <path d="M3 6h18M3 12h18M3 18h18" />,
  bell: (_c, a) => (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2z" fill={a} fillOpacity="0.39" />
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0" />
    </>
  ),
  moon: (_c, a) => (
    <>
      <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" fill={a} fillOpacity="0.39" />
      <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />
    </>
  ),
  sun: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="4" fill={a} fillOpacity="0.48" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  globe: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.28" />
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  settings: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="3" fill={a} fillOpacity="0.48" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  logout: (_c, a) => (
    <>
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" fill={a} fillOpacity="0.33" />
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M16 16l5-4-5-4M9 12h12" />
    </>
  ),
  user: (_c, a) => (
    <>
      <circle cx="12" cy="8" r="4" fill={a} fillOpacity="0.39" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" fill={a} fillOpacity="0.28" />
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  arrowRight: () => <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowRightLeft: (_c, a) => (
    <>
      <path d="M3 9h15l-3-3M21 15H6l3 3" stroke={a} strokeOpacity="0.64" strokeWidth="4" strokeLinecap="round" />
      <path d="M3 9h15l-3-3M21 15H6l3 3" />
    </>
  ),
  plus: () => <path d="M12 5v14M5 12h14" />,
  video: (_c, a) => (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M16 10l6-3v10l-6-3z" fill={a} fillOpacity="0.44" />
      <path d="M16 10l6-3v10l-6-3z" />
    </>
  ),
  bug: (_c, a) => (
    <>
      <path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4v1H8V8z" fill={a} fillOpacity="0.39" />
      <rect x="7" y="9" width="10" height="10" rx="4" fill={a} fillOpacity="0.36" />
      <path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4v1H8V8z" />
      <rect x="7" y="9" width="10" height="10" rx="4" />
      <path d="M3 13h4M17 13h4M3 17l3-1M21 17l-3-1M3 9l3 1M21 9l-3 1M12 13v6" />
    </>
  ),
  activity: (_c, a) => (
    <>
      <path d="M3 12h4l3-7 4 14 3-7h4" stroke={a} strokeOpacity="0.51" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </>
  ),
  server: (_c, a) => (
    <>
      <rect x="3" y="3" width="18" height="8" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="13" width="18" height="8" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="3" width="18" height="8" rx="2" />
      <rect x="3" y="13" width="18" height="8" rx="2" />
      <circle cx="7" cy="7" r="0.8" fill={a} stroke="none" />
      <circle cx="7" cy="17" r="0.8" fill={a} stroke="none" />
    </>
  ),
  barChart: (_c, a) => (
    <>
      <rect x="4" y="11" width="4" height="10" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="10" y="6" width="4" height="15" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="16" y="14" width="4" height="7" rx="1" fill={a} fillOpacity="0.44" />
      <path d="M4 11v10M6 21V11M10 6v15M12 21V6M16 14v7M18 21v-7" />
    </>
  ),
  palette: (_c, a) => (
    <>
      <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-3-4-4-8-4z" fill={a} fillOpacity="0.36" />
      <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-3-4-4-8-4z" />
      <circle cx="7" cy="12" r="1" fill={a} stroke="none" />
      <circle cx="9" cy="7" r="1" fill={a} stroke="none" />
      <circle cx="15" cy="7" r="1" fill={a} stroke="none" />
    </>
  ),
  users: (_c, a) => (
    <>
      <circle cx="9" cy="8" r="4" fill={a} fillOpacity="0.39" />
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7" />
      <path d="M16 3.5a4 4 0 0 1 0 7.5M17 14c3 .5 5 3 5 7" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  gauge: (_c, a) => (
    <>
      <path d="M12 13l5-5M12 3a9 9 0 1 1-9 9" fill={a} fillOpacity="0.28" />
      <circle cx="12" cy="13" r="9" fill={a} fillOpacity="0.28" />
      <path d="M3 13a9 9 0 1 1 18 0" />
      <path d="M12 13l5-5" />
      <circle cx="12" cy="13" r="1.5" fill={a} stroke="none" />
    </>
  ),
  layoutDashboard: (_c, a) => (
    <>
      <rect x="3" y="3" width="8" height="10" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="13" y="3" width="8" height="6" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="13" y="11" width="8" height="10" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="3" y="15" width="8" height="6" rx="1" fill={a} fillOpacity="0.39" />
      <rect x="3" y="3" width="8" height="10" rx="1" />
      <rect x="13" y="3" width="8" height="6" rx="1" />
      <rect x="13" y="11" width="8" height="10" rx="1" />
      <rect x="3" y="15" width="8" height="6" rx="1" />
    </>
  ),
  fileText: (_c, a) => (
    <>
      <path d="M6 3h9l4 4v14H6z" fill={a} fillOpacity="0.36" />
      <path d="M6 3h9l4 4v14H6zM15 3v4h4" />
      <path d="M9 12h7M9 16h5" />
    </>
  ),
  home: (_c, a) => (
    <>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9z" fill={a} fillOpacity="0.36" />
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9z" />
    </>
  ),

  // ── Extended UI ────────────────────────────────────────────────────────
  apple: (_c, a) => (
    <>
      <path d="M17 20c-1 1-2 1.5-3 1.5s-2-.5-3-.5-2 .5-3 .5-2-.5-3-1.5C3 17 2 13 4 10c1-1.5 3-2 4-2 1 0 2 .5 3 .5s2-.5 3-.5 3 .5 4 2c-2 1-3 3-3 5 0 2 1 3.5 2 5z" fill={a} fillOpacity="0.39" />
      <path d="M17 20c-1 1-2 1.5-3 1.5s-2-.5-3-.5-2 .5-3 .5-2-.5-3-1.5C3 17 2 13 4 10c1-1.5 3-2 4-2 1 0 2 .5 3 .5s2-.5 3-.5 3 .5 4 2c-2 1-3 3-3 5 0 2 1 3.5 2 5zM14 4c-.5 1.5-2 2.5-3 2.5" />
    </>
  ),
  archive: (_c, a) => (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" fill={a} fillOpacity="0.44" />
      <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" fill={a} fillOpacity="0.28" />
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zM10 13h4" />
    </>
  ),
  arrowDownLeft: (_c, a) => (
    <>
      <path d="M19 5L5 19M5 19V9M5 19h10" stroke={a} strokeOpacity="0.64" strokeWidth="5" strokeLinecap="round" />
      <path d="M19 5L5 19M5 19V9M5 19h10" />
    </>
  ),
  arrowDownRight: (_c, a) => (
    <>
      <path d="M5 5l14 14M19 19V9M19 19H9" stroke={a} strokeOpacity="0.64" strokeWidth="5" strokeLinecap="round" />
      <path d="M5 5l14 14M19 19V9M19 19H9" />
    </>
  ),
  arrowUpDown: (_c, a) => (
    <>
      <path d="M7 4v16M4 7l3-3 3 3M17 20V4M20 17l-3 3-3-3" stroke={a} strokeOpacity="0.64" strokeWidth="4" />
      <path d="M7 4v16M4 7l3-3 3 3M17 20V4M20 17l-3 3-3-3" />
    </>
  ),
  arrowUpRight: (_c, a) => (
    <>
      <path d="M5 19L19 5M19 5v10M19 5H9" stroke={a} strokeOpacity="0.64" strokeWidth="5" strokeLinecap="round" />
      <path d="M5 19L19 5M19 5v10M19 5H9" />
    </>
  ),
  ban: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.33" />
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  bandage: (_c, a) => (
    <>
      <rect x="-2" y="8" width="28" height="8" rx="4" fill={a} fillOpacity="0.36" transform="rotate(-45 12 12)" />
      <rect x="-2" y="8" width="28" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="M9 11l4 4M11 9l4 4M10 13l3 3M13 10l3 3" stroke={a} strokeOpacity="0.8" />
    </>
  ),
  banknote: (_c, a) => (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" fill={a} fillOpacity="0.4" />
      <path d="M6 12h.5M17.5 12h.5" />
    </>
  ),
  bedDouble: (_c, a) => (
    <>
      <path d="M3 8v12M21 8v12M3 14h18" />
      <path d="M4 14v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" fill={a} fillOpacity="0.36" />
      <path d="M4 14v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <circle cx="8" cy="11" r="1.5" fill={a} fillOpacity="0.6" stroke="none" />
      <circle cx="16" cy="11" r="1.5" fill={a} fillOpacity="0.6" stroke="none" />
    </>
  ),
  bellOff: (_c, a) => (
    <>
      <path d="M6 16V11a6 6 0 0 1 8-5.7" fill={a} fillOpacity="0.36" />
      <path d="M6 16V11a6 6 0 0 1 8-5.7M18 11v5l2 2H8M3 3l18 18M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  brain: (_c, a) => (
    <>
      <path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3v2a3 3 0 0 0 2 3v2a3 3 0 0 0 3 3h3V3H9zM15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3v2a3 3 0 0 1-2 3v2a3 3 0 0 1-3 3h-3V3h3z" fill={a} fillOpacity="0.39" />
      <path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3v2a3 3 0 0 0 2 3v2a3 3 0 0 0 3 3h3V3H9zM15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3v2a3 3 0 0 1-2 3v2a3 3 0 0 1-3 3h-3V3h3zM12 3v18" />
    </>
  ),
  camera: (_c, a) => (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill={a} fillOpacity="0.36" />
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" fill={a} fillOpacity="0.48" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  code: (_c, a) => (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" fill={a} fillOpacity="0.28" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 10l-3 2 3 2M16 10l3 2-3 2M13 9l-2 6" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  copy: (_c, a) => (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  cpu: (_c, a) => (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" fill={a} fillOpacity="0.39" />
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
    </>
  ),
  dollarSign: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.33" />
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9c-.5-1-2-2-4-2-2 0-3 1-3 2.5S9 12 12 12s4 1 4 2.5-1 2.5-3 2.5-3.5-1-4-2M12 5v14" />
    </>
  ),
  externalLink: (_c, a) => (
    <>
      <path d="M5 5h6v3H8v8h8v-3h3v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill={a} fillOpacity="0.33" />
      <path d="M5 5h6v3H8v8h8v-3h3v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM14 3h7v7M21 3l-9 9" />
    </>
  ),
  eye: (_c, a) => (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill={a} fillOpacity="0.36" />
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" fill={a} fillOpacity="0.6" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (_c, a) => (
    <>
      <path d="M9.9 4.2A10 10 0 0 1 12 4c6 0 10 8 10 8s-1 2-3 4" fill={a} fillOpacity="0.33" />
      <path d="M9.9 4.2A10 10 0 0 1 12 4c6 0 10 8 10 8s-1 2-3 4M17.5 17.5A10 10 0 0 1 12 20C6 20 2 12 2 12s2-4 5-6M3 3l18 18M10.5 10.5a3 3 0 0 0 4 4" />
    </>
  ),
  fileJson: (_c, a) => (
    <>
      <path d="M6 3h9l4 4v14H6z" fill={a} fillOpacity="0.36" />
      <path d="M6 3h9l4 4v14H6zM15 3v4h4" />
      <path d="M9 13c-1 0-1 1-1 2s0 2 1 2M15 13c1 0 1 1 1 2s0 2-1 2" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  fileSpreadsheet: (_c, a) => (
    <>
      <path d="M6 3h9l4 4v14H6z" fill={a} fillOpacity="0.36" />
      <path d="M6 3h9l4 4v14H6zM15 3v4h4" />
      <path d="M8 13h11M8 17h11M12 11v10" stroke={a} strokeOpacity="0.8" />
    </>
  ),
  fileUp: (_c, a) => (
    <>
      <path d="M6 3h9l4 4v14H6z" fill={a} fillOpacity="0.36" />
      <path d="M6 3h9l4 4v14H6zM15 3v4h4M12 17v-5M9 14l3-3 3 3" />
    </>
  ),
  flag: (_c, a) => (
    <>
      <path d="M5 3v18M5 4h12l-2 4 2 4H5" fill={a} fillOpacity="0.44" />
      <path d="M5 3v18M5 4h12l-2 4 2 4H5" />
    </>
  ),
  folderOpen: (_c, a) => (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3V7zM3 10h18l-2 8a2 2 0 0 1-2 1H5a2 2 0 0 1-2-1V10z" fill={a} fillOpacity="0.36" />
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1M3 10h18l-2 8a2 2 0 0 1-2 1H5a2 2 0 0 1-2-1V10z" />
    </>
  ),
  gift: (_c, a) => (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" fill={a} fillOpacity="0.44" />
      <path d="M4 12h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8z" fill={a} fillOpacity="0.28" />
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M4 12h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8zM12 8v13M9 8a2.5 2.5 0 1 1 3-3 2.5 2.5 0 1 1 3 3" />
    </>
  ),
  gitBranch: (_c, a) => (
    <>
      <circle cx="6" cy="5" r="2.5" fill={a} fillOpacity="0.44" />
      <circle cx="6" cy="19" r="2.5" fill={a} fillOpacity="0.44" />
      <circle cx="18" cy="7" r="2.5" fill={a} fillOpacity="0.44" />
      <circle cx="6" cy="5" r="2.5" />
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M6 7.5v9M18 9.5c0 4-4 4-6 4h-3" />
    </>
  ),
  gitCompare: (_c, a) => (
    <>
      <circle cx="6" cy="6" r="2.5" fill={a} fillOpacity="0.44" />
      <circle cx="18" cy="18" r="2.5" fill={a} fillOpacity="0.44" />
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M11 6h3a3 3 0 0 1 3 3v7M13 18h-3a3 3 0 0 1-3-3V8M8 4L6 6l2 2M16 20l2-2-2-2" />
    </>
  ),
  hardDrive: (_c, a) => (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 12h20" />
      <circle cx="7" cy="15" r="1" fill={a} stroke="none" />
      <circle cx="11" cy="15" r="1" fill={a} stroke="none" />
    </>
  ),
  helpCircle: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.36" />
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4" />
      <circle cx="12" cy="17" r="1" fill={a} stroke="none" />
    </>
  ),
  history: (_c, a) => (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" fill={a} fillOpacity="0.28" />
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2" />
    </>
  ),
  image: (_c, a) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill={a} fillOpacity="0.8" stroke="none" />
      <path d="M4 18l5-5 4 4 3-3 4 4" />
    </>
  ),
  info: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.36" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="1" fill={a} stroke="none" />
    </>
  ),
  keyRound: (_c, a) => (
    <>
      <circle cx="8" cy="15" r="5" fill={a} fillOpacity="0.39" />
      <circle cx="8" cy="15" r="5" />
      <path d="M10.5 11.5L21 3M18 6l3 3M15 9l3 3" />
    </>
  ),
  keyboard: (_c, a) => (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={a} fillOpacity="0.33" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.5M10 10h.5M14 10h.5M18 10h.5M6 14h12" />
    </>
  ),
  languages: (_c, a) => (
    <>
      <path d="M5 8h11M10 5v3M5 12l3 9M16 12l3 9M12 21l1-3h5l1 3" fill={a} fillOpacity="0.33" />
      <path d="M5 8h11M10 5v3M5 12l3 9M9.5 18h5M16 12l3 9M13 18h5" />
      <path d="M10 8c-.5 3-2 5-4 6M12 9c1 3 3 5 4 6" stroke={a} strokeOpacity="0.9" />
    </>
  ),
  layers: (_c, a) => (
    <>
      <path d="M12 2l10 5-10 5L2 7l10-5z" fill={a} fillOpacity="0.44" />
      <path d="M12 2l10 5-10 5L2 7l10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
    </>
  ),
  lineChart: (_c, a) => (
    <>
      <path d="M3 3v18h18" />
      <path d="M6 16l4-5 4 3 6-8" stroke={a} strokeOpacity="0.57" strokeWidth="5" strokeLinecap="round" />
      <path d="M6 16l4-5 4 3 6-8" />
    </>
  ),
  list: (_c, a) => (
    <>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="5" cy="6" r="1.2" fill={a} stroke="none" />
      <circle cx="5" cy="12" r="1.2" fill={a} stroke="none" />
      <circle cx="5" cy="18" r="1.2" fill={a} stroke="none" />
    </>
  ),
  loader: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.21" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.51" />
    </>
  ),
  lock: (_c, a) => (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" fill={a} fillOpacity="0.39" />
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="16" r="1.2" fill={a} stroke="none" />
    </>
  ),
  logIn: (_c, a) => (
    <>
      <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" fill={a} fillOpacity="0.33" />
      <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M3 12h12M11 8l4 4-4 4" />
    </>
  ),
  mail: (_c, a) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  maximize: (_c, a) => (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <rect x="7" y="7" width="10" height="10" rx="1" fill={a} fillOpacity="0.36" stroke="none" />
    </>
  ),
  mic: (_c, a) => (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" fill={a} fillOpacity="0.44" />
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 12a7 7 0 0 0 14 0M12 19v3" />
    </>
  ),
  micOff: (_c, a) => (
    <>
      <path d="M9 3h.5A3 3 0 0 1 15 6v4" fill={a} fillOpacity="0.36" />
      <path d="M9 9v3a3 3 0 0 0 5 2.2M5 12a7 7 0 0 0 11 5.5M12 19v3M3 3l18 18M15 9V6a3 3 0 0 0-3-3" />
    </>
  ),
  microscope: (_c, a) => (
    <>
      <path d="M6 21h15M8 18l4-4M10 6l-3 3 6 6 3-3-6-6z" fill={a} fillOpacity="0.36" />
      <path d="M6 21h15M8 18l4-4M10 6l-3 3 6 6 3-3-6-6zM14 8l4-4M10 21a5 5 0 0 0 10-5" />
    </>
  ),
  minus: () => <path d="M5 12h14" />,
  monitorSmartphone: (_c, a) => (
    <>
      <rect x="2" y="4" width="14" height="12" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="14" y="10" width="8" height="12" rx="1.5" fill={a} fillOpacity="0.44" />
      <rect x="2" y="4" width="14" height="12" rx="2" />
      <rect x="14" y="10" width="8" height="12" rx="1.5" />
      <path d="M5 20h5M8 16v4M18 18h.5" />
    </>
  ),
  moreVertical: (_c, a) => (
    <>
      <circle cx="12" cy="5" r="1.5" fill={a} fillOpacity="0.9" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill={a} fillOpacity="0.9" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill={a} fillOpacity="0.9" stroke="none" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </>
  ),
  navigation: (_c, a) => (
    <>
      <path d="M12 2l9 20-9-5-9 5 9-20z" fill={a} fillOpacity="0.44" />
      <path d="M12 2l9 20-9-5-9 5 9-20z" />
    </>
  ),
  network: (_c, a) => (
    <>
      <rect x="9" y="2" width="6" height="6" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="2" y="16" width="6" height="6" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="16" y="16" width="6" height="6" rx="1" fill={a} fillOpacity="0.44" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <path d="M12 8v4M5 16v-2h14v2" />
    </>
  ),
  package: (_c, a) => (
    <>
      <path d="M12 3l9 5v8l-9 5-9-5V8l9-5z" fill={a} fillOpacity="0.39" />
      <path d="M12 3l9 5v8l-9 5-9-5V8l9-5zM3 8l9 5 9-5M12 13v10M7.5 5.5l9 5" />
    </>
  ),
  paperclip: (_c, a) => (
    <>
      <path d="M21 11l-9 9a5 5 0 1 1-7-7l9-9a3.5 3.5 0 1 1 5 5l-8.5 8.5a2 2 0 1 1-3-3l8-8" fill={a} fillOpacity="0.28" />
      <path d="M21 11l-9 9a5 5 0 1 1-7-7l9-9a3.5 3.5 0 1 1 5 5l-8.5 8.5a2 2 0 1 1-3-3l8-8" />
    </>
  ),
  pause: (_c, a) => (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" fill={a} fillOpacity="0.48" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill={a} fillOpacity="0.48" />
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  phoneOff: (_c, a) => (
    <>
      <path d="M11 15l2-2c3 1 5 3 6 6l-2 2a2 2 0 0 1-2 0c-8 0-16-8-16-16a2 2 0 0 1 0-2l2-2c3 1 5 3 6 6l-2 2" fill={a} fillOpacity="0.36" />
      <path d="M11 15l2-2c3 1 5 3 6 6l-2 2a2 2 0 0 1-2 0c-8 0-16-8-16-16a2 2 0 0 1 0-2l2-2c3 1 5 3 6 6l-2 2M3 3l18 18" />
    </>
  ),
  pieChart: (_c, a) => (
    <>
      <path d="M12 3a9 9 0 1 0 9 9h-9V3z" fill={a} fillOpacity="0.48" />
      <path d="M12 3v9h9A9 9 0 0 0 12 3z" fill={a} fillOpacity="0.28" />
      <path d="M12 3a9 9 0 1 0 9 9h-9V3z" />
      <path d="M12 3v9h9A9 9 0 0 0 12 3z" />
    </>
  ),
  play: (_c, a) => (
    <>
      <path d="M6 4l14 8-14 8V4z" fill={a} fillOpacity="0.48" />
      <path d="M6 4l14 8-14 8V4z" />
    </>
  ),
  radio: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="2" fill={a} fillOpacity="0.6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
    </>
  ),
  refresh: (_c, a) => (
    <>
      <path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" stroke={a} strokeOpacity="0.51" strokeWidth="5" strokeLinecap="round" />
      <path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v5h-5M6 21v-5h5" />
    </>
  ),
  rotate: (_c, a) => (
    <>
      <path d="M3 12a9 9 0 1 1 3 6.7" stroke={a} strokeOpacity="0.57" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 12a9 9 0 1 1 3 6.7M3 16v5h5" />
    </>
  ),
  save: (_c, a) => (
    <>
      <path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H4z" fill={a} fillOpacity="0.36" />
      <path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H4z" />
      <rect x="7" y="14" width="10" height="6" />
      <path d="M7 4v5h9V4" />
    </>
  ),
  send: (_c, a) => (
    <>
      <path d="M3 12l18-8-8 18-2-8-8-2z" fill={a} fillOpacity="0.39" />
      <path d="M3 12l18-8-8 18-2-8-8-2z" />
    </>
  ),
  sendHorizontal: (_c, a) => (
    <>
      <path d="M3 12L21 4 16 22l-4-8-9-2z" fill={a} fillOpacity="0.39" />
      <path d="M3 12L21 4 16 22l-4-8-9-2zM12 14L21 4" />
    </>
  ),
  shoppingCart: (_c, a) => (
    <>
      <path d="M3 3h3l2 13h11l2-9H7" fill={a} fillOpacity="0.33" />
      <path d="M3 3h3l2 13h11l2-9H7" />
      <circle cx="9" cy="20" r="1.5" fill={a} stroke="none" />
      <circle cx="17" cy="20" r="1.5" fill={a} stroke="none" />
    </>
  ),
  signal: (_c, a) => (
    <>
      <path d="M3 20h2v-4H3zM8 20h2v-8H8zM13 20h2V8h-2zM18 20h2V4h-2z" fill={a} fillOpacity="0.44" />
      <path d="M3 20h2v-4H3zM8 20h2v-8H8zM13 20h2V8h-2zM18 20h2V4h-2z" />
    </>
  ),
  sliders: (_c, a) => (
    <>
      <path d="M4 7h5M13 7h7M4 12h11M19 12h1M4 17h3M11 17h9" />
      <circle cx="11" cy="7" r="2" fill={a} fillOpacity="0.4" />
      <circle cx="17" cy="12" r="2" fill={a} fillOpacity="0.4" />
      <circle cx="9" cy="17" r="2" fill={a} fillOpacity="0.4" />
      <circle cx="11" cy="7" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  square: (_c, a) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" fill={a} fillOpacity="0.36" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </>
  ),
  star: (_c, a) => (
    <>
      <path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" fill={a} fillOpacity="0.48" />
      <path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
    </>
  ),
  table: (_c, a) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" fill={a} fillOpacity="0.28" />
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M3 16h18M9 4v16M15 4v16" />
    </>
  ),
  target: (_c, a) => (
    <>
      <circle cx="12" cy="12" r="9" fill={a} fillOpacity="0.21" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill={a} stroke="none" />
    </>
  ),
  thumbsUp: (_c, a) => (
    <>
      <path d="M3 10h4v11H3zM7 10l4-7c2 0 3 1 3 3v3h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 1H7V10z" fill={a} fillOpacity="0.36" />
      <path d="M3 10h4v11H3zM7 10l4-7c2 0 3 1 3 3v3h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 1H7V10z" />
    </>
  ),
  timer: (_c, a) => (
    <>
      <circle cx="12" cy="14" r="8" fill={a} fillOpacity="0.33" />
      <circle cx="12" cy="14" r="8" />
      <path d="M9 2h6M12 9v5l3 2" />
    </>
  ),
  toggleLeft: (_c, a) => (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" fill={a} fillOpacity="0.36" />
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="7" cy="12" r="3" fill={a} fillOpacity="0.8" stroke="none" />
      <circle cx="7" cy="12" r="3" />
    </>
  ),
  toggleRight: (_c, a) => (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" fill={a} fillOpacity="0.44" />
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="17" cy="12" r="3" fill={a} fillOpacity="0.9" stroke="none" />
      <circle cx="17" cy="12" r="3" />
    </>
  ),
  trash: (_c, a) => (
    <>
      <path d="M5 7h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7z" fill={a} fillOpacity="0.36" />
      <path d="M5 7h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7zM3 7h18M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M10 11v7M14 11v7" />
    </>
  ),
  trendingDown: (_c, a) => (
    <>
      <path d="M3 6l8 8 4-4 6 6" stroke={a} strokeOpacity="0.57" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 6l8 8 4-4 6 6M21 10v6h-6" />
    </>
  ),
  trendingUp: (_c, a) => (
    <>
      <path d="M3 18l8-8 4 4 6-6" stroke={a} strokeOpacity="0.57" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 18l8-8 4 4 6-6M21 14V8h-6" />
    </>
  ),
  truck: (_c, a) => (
    <>
      <rect x="2" y="6" width="13" height="10" rx="1" fill={a} fillOpacity="0.36" />
      <path d="M15 10h4l3 3v3h-7V10z" fill={a} fillOpacity="0.44" />
      <rect x="2" y="6" width="13" height="10" rx="1" />
      <path d="M15 10h4l3 3v3h-7V10z" />
      <circle cx="7" cy="18" r="1.8" fill={a} stroke="none" />
      <circle cx="18" cy="18" r="1.8" fill={a} stroke="none" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="18" cy="18" r="1.8" />
    </>
  ),
  upload: (_c, a) => (
    <>
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill={a} fillOpacity="0.36" />
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M12 15V3M7 8l5-5 5 5" />
    </>
  ),
  userX: (_c, a) => (
    <>
      <circle cx="10" cy="8" r="4" fill={a} fillOpacity="0.39" />
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21c0-4 3.6-7 8-7 1.5 0 2.8.3 4 .9M17 14l5 5M22 14l-5 5" />
    </>
  ),
  utensils: (_c, a) => (
    <>
      <path d="M6 3v18M6 3c-2 0-2 4-2 6s2 2 2 2M19 3c-2 1-3 4-3 6s1 3 2 3v9" fill={a} fillOpacity="0.33" />
      <path d="M6 3v18M6 3c-2 0-2 4-2 6s2 2 2 2M19 3c-2 1-3 4-3 6s1 3 2 3v9" />
    </>
  ),
  utensilsCrossed: (_c, a) => (
    <>
      <path d="M15 3l-5 5 5 5 7-7-7-3zM4 14l3 3-5 5M10 14l6 6" fill={a} fillOpacity="0.28" />
      <path d="M15 3l-5 5 5 5 7-7-7-3zM4 14l3 3-5 5M10 14l6 6" />
    </>
  ),
  wind: (_c, a) => (
    <>
      <path d="M3 8h13a3 3 0 1 0-3-3M3 12h17M3 16h11a3 3 0 1 1-3 3" stroke={a} strokeOpacity="0.64" strokeWidth="4" strokeLinecap="round" />
      <path d="M3 8h13a3 3 0 1 0-3-3M3 12h17M3 16h11a3 3 0 1 1-3 3" />
    </>
  ),
  zap: (_c, a) => (
    <>
      <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill={a} fillOpacity="0.48" />
      <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
    </>
  ),
  zapOff: (_c, a) => (
    <>
      <path d="M13 2L9 7l6 6 5-7h-7l2-4zM10 14H4l5 8-1-6" fill={a} fillOpacity="0.28" />
      <path d="M13 2L9 7l6 6 5-7h-7l2-4zM10 14H4l5 8-1-6M3 3l18 18" />
    </>
  ),
};

// ───────────────────────────────────────────────────────────────────────────
// Public component
// ───────────────────────────────────────────────────────────────────────────
export function Icon(props: IconProps) {
  const p = PATHS[props.name];
  if (!p) return null;
  return render(props.name, p, props);
}

// Metadata for library showcase / palette tooling
export const ICONS: Record<IconName, { name: string; category: string }> = {
  chart: { name: 'Dashboard chart', category: 'clinical' },
  patient: { name: 'Patient', category: 'clinical' },
  stethoscope: { name: 'Stethoscope', category: 'clinical' },
  referral: { name: 'Referral', category: 'clinical' },
  message: { name: 'Message', category: 'clinical' },
  calendar: { name: 'Calendar', category: 'clinical' },
  timeline: { name: 'Timeline', category: 'clinical' },
  record: { name: 'Record', category: 'clinical' },
  consultation: { name: 'Consultation', category: 'clinical' },
  triage: { name: 'Triage', category: 'clinical' },
  flask: { name: 'Lab flask', category: 'services' },
  pill: { name: 'Pill', category: 'services' },
  wallet: { name: 'Wallet', category: 'services' },
  prescription: { name: 'Prescription', category: 'services' },
  claim: { name: 'Claim', category: 'services' },
  receipt: { name: 'Receipt', category: 'services' },
  creditCard: { name: 'Credit card', category: 'services' },
  mobileMoney: { name: 'Mobile money', category: 'services' },
  diagnosis: { name: 'Diagnosis', category: 'services' },
  vaccine: { name: 'Vaccine', category: 'vital-events' },
  pregnant: { name: 'Antenatal', category: 'vital-events' },
  baby: { name: 'Birth', category: 'vital-events' },
  skull: { name: 'Death', category: 'vital-events' },
  surveillance: { name: 'Surveillance', category: 'vital-events' },
  mch: { name: 'MCH', category: 'vital-events' },
  heart: { name: 'Heart', category: 'vitals' },
  bloodPressure: { name: 'Blood pressure', category: 'vitals' },
  thermometer: { name: 'Temperature', category: 'vitals' },
  oxygen: { name: 'SpO₂', category: 'vitals' },
  lungs: { name: 'Lungs', category: 'vitals' },
  weight: { name: 'Weight', category: 'vitals' },
  pulse: { name: 'Pulse', category: 'vitals' },
  building: { name: 'Facility', category: 'ui' },
  wifi: { name: 'Online', category: 'ui' },
  wifiOff: { name: 'Offline', category: 'ui' },
  cloudOff: { name: 'Local only', category: 'ui' },
  search: { name: 'Search', category: 'ui' },
  alert: { name: 'Alert', category: 'ui' },
  chevronLeft: { name: 'Chevron left', category: 'ui' },
  chevronRight: { name: 'Chevron right', category: 'ui' },
  chevronDown: { name: 'Chevron down', category: 'ui' },
  chevronUp: { name: 'Chevron up', category: 'ui' },
  qr: { name: 'QR code', category: 'ui' },
  phone: { name: 'Phone', category: 'ui' },
  mapPin: { name: 'Location', category: 'ui' },
  clock: { name: 'Clock', category: 'ui' },
  edit: { name: 'Edit', category: 'ui' },
  printer: { name: 'Print', category: 'ui' },
  download: { name: 'Download', category: 'ui' },
  shield: { name: 'Shield', category: 'ui' },
  sparkle: { name: 'AI / Sparkle', category: 'ui' },
  check: { name: 'Check', category: 'ui' },
  close: { name: 'Close', category: 'ui' },
  menu: { name: 'Menu', category: 'ui' },
  bell: { name: 'Notifications', category: 'ui' },
  moon: { name: 'Dark mode', category: 'ui' },
  sun: { name: 'Light mode', category: 'ui' },
  globe: { name: 'Globe', category: 'ui' },
  settings: { name: 'Settings', category: 'ui' },
  logout: { name: 'Logout', category: 'ui' },
  user: { name: 'User', category: 'ui' },
  arrowRight: { name: 'Arrow right', category: 'ui' },
  arrowRightLeft: { name: 'Arrows exchange', category: 'ui' },
  plus: { name: 'Plus', category: 'ui' },
  video: { name: 'Telehealth', category: 'ui' },
  bug: { name: 'Epidemic', category: 'ui' },
  activity: { name: 'Activity', category: 'ui' },
  server: { name: 'System', category: 'ui' },
  barChart: { name: 'Reports', category: 'ui' },
  palette: { name: 'Branding', category: 'ui' },
  users: { name: 'Users', category: 'ui' },
  gauge: { name: 'Dashboard', category: 'ui' },
  layoutDashboard: { name: 'Layout', category: 'ui' },
  fileText: { name: 'File', category: 'ui' },
  home: { name: 'Home', category: 'ui' },
  apple: { name: 'Apple', category: 'ui' },
  archive: { name: 'Archive', category: 'ui' },
  arrowDownLeft: { name: 'Arrow down-left', category: 'ui' },
  arrowDownRight: { name: 'Arrow down-right', category: 'ui' },
  arrowUpDown: { name: 'Arrow up-down', category: 'ui' },
  arrowUpRight: { name: 'Arrow up-right', category: 'ui' },
  ban: { name: 'Ban', category: 'ui' },
  bandage: { name: 'Bandage', category: 'ui' },
  banknote: { name: 'Banknote', category: 'services' },
  bedDouble: { name: 'Bed', category: 'clinical' },
  bellOff: { name: 'Bell off', category: 'ui' },
  brain: { name: 'Brain', category: 'clinical' },
  camera: { name: 'Camera', category: 'ui' },
  code: { name: 'Code', category: 'ui' },
  copy: { name: 'Copy', category: 'ui' },
  cpu: { name: 'CPU', category: 'ui' },
  dollarSign: { name: 'Dollar', category: 'services' },
  externalLink: { name: 'External link', category: 'ui' },
  eye: { name: 'Eye', category: 'ui' },
  eyeOff: { name: 'Eye off', category: 'ui' },
  fileJson: { name: 'File · JSON', category: 'ui' },
  fileSpreadsheet: { name: 'File · Sheet', category: 'ui' },
  fileUp: { name: 'File upload', category: 'ui' },
  flag: { name: 'Flag', category: 'ui' },
  folderOpen: { name: 'Folder', category: 'ui' },
  gift: { name: 'Gift', category: 'ui' },
  gitBranch: { name: 'Git branch', category: 'ui' },
  gitCompare: { name: 'Git compare', category: 'ui' },
  hardDrive: { name: 'Hard drive', category: 'ui' },
  helpCircle: { name: 'Help', category: 'ui' },
  history: { name: 'History', category: 'ui' },
  image: { name: 'Image', category: 'ui' },
  info: { name: 'Info', category: 'ui' },
  keyRound: { name: 'Key', category: 'ui' },
  keyboard: { name: 'Keyboard', category: 'ui' },
  languages: { name: 'Languages', category: 'ui' },
  layers: { name: 'Layers', category: 'ui' },
  lineChart: { name: 'Line chart', category: 'ui' },
  list: { name: 'List', category: 'ui' },
  loader: { name: 'Loader', category: 'ui' },
  lock: { name: 'Lock', category: 'ui' },
  logIn: { name: 'Log in', category: 'ui' },
  mail: { name: 'Mail', category: 'ui' },
  maximize: { name: 'Maximize', category: 'ui' },
  mic: { name: 'Mic', category: 'ui' },
  micOff: { name: 'Mic off', category: 'ui' },
  microscope: { name: 'Microscope', category: 'clinical' },
  minus: { name: 'Minus', category: 'ui' },
  monitorSmartphone: { name: 'Devices', category: 'ui' },
  moreVertical: { name: 'More', category: 'ui' },
  navigation: { name: 'Navigation', category: 'ui' },
  network: { name: 'Network', category: 'ui' },
  package: { name: 'Package', category: 'ui' },
  paperclip: { name: 'Attachment', category: 'ui' },
  pause: { name: 'Pause', category: 'ui' },
  phoneOff: { name: 'Phone off', category: 'ui' },
  pieChart: { name: 'Pie chart', category: 'ui' },
  play: { name: 'Play', category: 'ui' },
  radio: { name: 'Radio', category: 'ui' },
  refresh: { name: 'Refresh', category: 'ui' },
  rotate: { name: 'Rotate', category: 'ui' },
  save: { name: 'Save', category: 'ui' },
  send: { name: 'Send', category: 'ui' },
  sendHorizontal: { name: 'Send', category: 'ui' },
  shoppingCart: { name: 'Cart', category: 'services' },
  signal: { name: 'Signal', category: 'ui' },
  sliders: { name: 'Filters', category: 'ui' },
  square: { name: 'Square', category: 'ui' },
  star: { name: 'Star', category: 'ui' },
  table: { name: 'Table', category: 'ui' },
  target: { name: 'Target', category: 'ui' },
  thumbsUp: { name: 'Thumbs up', category: 'ui' },
  timer: { name: 'Timer', category: 'ui' },
  toggleLeft: { name: 'Toggle · off', category: 'ui' },
  toggleRight: { name: 'Toggle · on', category: 'ui' },
  trash: { name: 'Trash', category: 'ui' },
  trendingDown: { name: 'Trending down', category: 'ui' },
  trendingUp: { name: 'Trending up', category: 'ui' },
  truck: { name: 'Truck', category: 'ui' },
  upload: { name: 'Upload', category: 'ui' },
  userX: { name: 'User · remove', category: 'ui' },
  utensils: { name: 'Utensils', category: 'ui' },
  utensilsCrossed: { name: 'Utensils crossed', category: 'ui' },
  wind: { name: 'Wind', category: 'ui' },
  zap: { name: 'Zap', category: 'ui' },
  zapOff: { name: 'Zap off', category: 'ui' },
};

// ───────────────────────────────────────────────────────────────────────────
// Lucide-compatible wrappers — each exported name accepts the same props
// signature as a lucide-react component (className, size, strokeWidth, color)
// so they drop in as icon fields in nav configs without any call-site changes.
// ───────────────────────────────────────────────────────────────────────────
type LucideCompatProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  size?: number | string;
  strokeWidth?: number | string;
  color?: string;
  absoluteStrokeWidth?: boolean;
};

// Matches lucide-react's LucideIcon shape (ForwardRefExoticComponent) so our
// duotone wrappers are drop-in replacements anywhere a LucideIcon type is
// expected (nav configs, PageHeader, payment-method registries, etc).
type LucideCompatIcon = ForwardRefExoticComponent<
  Omit<LucideCompatProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

function makeLucide(iconName: IconName, defaultAccent?: string): LucideCompatIcon {
  const C = forwardRef<SVGSVGElement, LucideCompatProps>(function Duotone(
    { size, strokeWidth, color, absoluteStrokeWidth: _abs, name: _n, ...rest },
    ref,
  ) {
    return (
      <Icon
        {...rest}
        name={iconName}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        accent={defaultAccent}
        ref={ref}
      />
    );
  });
  C.displayName = `Duotone.${iconName}`;
  return C;
}

// Clinical
export const DuotoneChart = makeLucide('chart', '#2E9E7E');
export const DuotonePatient = makeLucide('patient', '#2E9E7E');
export const DuotoneStethoscope = makeLucide('stethoscope', '#2E9E7E');
export const DuotoneReferral = makeLucide('referral', '#1B7FA8');
export const DuotoneMessage = makeLucide('message', '#2A7A6E');
export const DuotoneCalendar = makeLucide('calendar', '#E4A84B');
export const DuotoneTimeline = makeLucide('timeline', '#1A3A3A');
export const DuotoneConsultation = makeLucide('consultation', '#2E9E7E');
export const DuotoneRecord = makeLucide('record', '#5A7370');

// Services
export const DuotoneFlask = makeLucide('flask', '#E4A84B');
export const DuotonePill = makeLucide('pill', '#2E9E7E');
export const DuotoneWallet = makeLucide('wallet', '#1B7FA8');
export const DuotonePrescription = makeLucide('prescription', '#2E9E7E');
export const DuotoneClaim = makeLucide('claim', '#1B9E77');
export const DuotoneReceipt = makeLucide('receipt', '#1A3A3A');
export const DuotoneCreditCard = makeLucide('creditCard', '#1B7FA8');
export const DuotoneMobileMoney = makeLucide('mobileMoney', '#D96E59');
export const DuotoneDiagnosis = makeLucide('diagnosis', '#2E9E7E');

// Vital events
export const DuotoneVaccine = makeLucide('vaccine', '#D96E59');
export const DuotonePregnant = makeLucide('pregnant', '#D96E59');
export const DuotoneBaby = makeLucide('baby', '#D96E59');
export const DuotoneSkull = makeLucide('skull', '#5A7370');
export const DuotoneSurveillance = makeLucide('surveillance', '#C44536');
export const DuotoneMCH = makeLucide('mch', '#D96E59');

// Vitals
export const DuotoneHeart = makeLucide('heart', '#C44536');
export const DuotoneBloodPressure = makeLucide('bloodPressure', '#C44536');
export const DuotoneThermometer = makeLucide('thermometer', '#E4A84B');
export const DuotoneOxygen = makeLucide('oxygen', '#2E9E7E');
export const DuotoneLungs = makeLucide('lungs', '#1B7FA8');
export const DuotoneWeight = makeLucide('weight', '#1A3A3A');
export const DuotonePulse = makeLucide('pulse', '#C44536');

// UI
export const DuotoneBuilding = makeLucide('building', '#2E9E7E');
export const DuotoneWifi = makeLucide('wifi', '#1B9E77');
export const DuotoneWifiOff = makeLucide('wifiOff', '#E4A84B');
export const DuotoneCloudOff = makeLucide('cloudOff', '#5A7370');
export const DuotoneSearch = makeLucide('search');
export const DuotoneAlert = makeLucide('alert', '#E4A84B');
export const DuotoneChevronLeft = makeLucide('chevronLeft');
export const DuotoneChevronRight = makeLucide('chevronRight');
export const DuotoneChevronDown = makeLucide('chevronDown');
export const DuotoneChevronUp = makeLucide('chevronUp');
export const DuotoneQR = makeLucide('qr', '#1A3A3A');
export const DuotonePhone = makeLucide('phone', '#2E9E7E');
export const DuotoneMapPin = makeLucide('mapPin', '#C44536');
export const DuotoneClock = makeLucide('clock', '#E4A84B');
export const DuotoneEdit = makeLucide('edit');
export const DuotonePrinter = makeLucide('printer');
export const DuotoneDownload = makeLucide('download');
export const DuotoneShield = makeLucide('shield', '#1B9E77');
export const DuotoneSparkle = makeLucide('sparkle', '#2E9E7E');
export const DuotoneCheck = makeLucide('check');
export const DuotoneClose = makeLucide('close');
export const DuotoneMenu = makeLucide('menu');
export const DuotoneBell = makeLucide('bell', '#E4A84B');
export const DuotoneMoon = makeLucide('moon', '#1A3A3A');
export const DuotoneSun = makeLucide('sun', '#E4A84B');
export const DuotoneGlobe = makeLucide('globe', '#1B7FA8');
export const DuotoneSettings = makeLucide('settings');
export const DuotoneLogout = makeLucide('logout');
export const DuotoneUser = makeLucide('user', '#2E9E7E');
export const DuotoneArrowRight = makeLucide('arrowRight');
export const DuotoneArrowRightLeft = makeLucide('arrowRightLeft', '#1B7FA8');
export const DuotonePlus = makeLucide('plus');
export const DuotoneVideo = makeLucide('video', '#2E9E7E');
export const DuotoneBug = makeLucide('bug', '#C44536');
export const DuotoneActivity = makeLucide('activity', '#2E9E7E');
export const DuotoneServer = makeLucide('server', '#5A7370');
export const DuotoneBarChart = makeLucide('barChart', '#1B7FA8');
export const DuotonePalette = makeLucide('palette', '#D96E59');
export const DuotoneUsers = makeLucide('users', '#2E9E7E');
export const DuotoneGauge = makeLucide('gauge', '#2E9E7E');
export const DuotoneLayoutDashboard = makeLucide('layoutDashboard', '#2E9E7E');
export const DuotoneFileText = makeLucide('fileText', '#5A7370');
export const DuotoneHome = makeLucide('home', '#2E9E7E');

// Extended UI
export const DuotoneApple = makeLucide('apple', '#C44536');
export const DuotoneArchive = makeLucide('archive', '#5A7370');
export const DuotoneArrowDownLeft = makeLucide('arrowDownLeft', '#5A7370');
export const DuotoneArrowDownRight = makeLucide('arrowDownRight', '#5A7370');
export const DuotoneArrowUpDown = makeLucide('arrowUpDown', '#5A7370');
export const DuotoneArrowUpRight = makeLucide('arrowUpRight', '#2E9E7E');
export const DuotoneBan = makeLucide('ban', '#C44536');
export const DuotoneBandage = makeLucide('bandage', '#D96E59');
export const DuotoneBanknote = makeLucide('banknote', '#1B9E77');
export const DuotoneBedDouble = makeLucide('bedDouble', '#1B7FA8');
export const DuotoneBellOff = makeLucide('bellOff', '#5A7370');
export const DuotoneBrain = makeLucide('brain', '#2E9E7E');
export const DuotoneCamera = makeLucide('camera', '#1A3A3A');
export const DuotoneCode = makeLucide('code', '#1B7FA8');
export const DuotoneCopy = makeLucide('copy', '#5A7370');
export const DuotoneCpu = makeLucide('cpu', '#1B7FA8');
export const DuotoneDollarSign = makeLucide('dollarSign', '#1B9E77');
export const DuotoneExternalLink = makeLucide('externalLink', '#1B7FA8');
export const DuotoneEye = makeLucide('eye', '#2E9E7E');
export const DuotoneEyeOff = makeLucide('eyeOff', '#5A7370');
export const DuotoneFileJson = makeLucide('fileJson', '#E4A84B');
export const DuotoneFileSpreadsheet = makeLucide('fileSpreadsheet', '#1B9E77');
export const DuotoneFileUp = makeLucide('fileUp', '#2E9E7E');
export const DuotoneFlag = makeLucide('flag', '#C44536');
export const DuotoneFolderOpen = makeLucide('folderOpen', '#E4A84B');
export const DuotoneGift = makeLucide('gift', '#D96E59');
export const DuotoneGitBranch = makeLucide('gitBranch', '#1B7FA8');
export const DuotoneGitCompare = makeLucide('gitCompare', '#1B7FA8');
export const DuotoneHardDrive = makeLucide('hardDrive', '#5A7370');
export const DuotoneHelpCircle = makeLucide('helpCircle', '#1B7FA8');
export const DuotoneHistory = makeLucide('history', '#5A7370');
export const DuotoneImage = makeLucide('image', '#D96E59');
export const DuotoneInfo = makeLucide('info', '#1B7FA8');
export const DuotoneKeyRound = makeLucide('keyRound', '#E4A84B');
export const DuotoneKeyboard = makeLucide('keyboard', '#5A7370');
export const DuotoneLanguages = makeLucide('languages', '#1B7FA8');
export const DuotoneLayers = makeLucide('layers', '#1B7FA8');
export const DuotoneLineChart = makeLucide('lineChart', '#2E9E7E');
export const DuotoneList = makeLucide('list', '#5A7370');
export const DuotoneLoader = makeLucide('loader', '#2E9E7E');
export const DuotoneLock = makeLucide('lock', '#1A3A3A');
export const DuotoneLogIn = makeLucide('logIn', '#2E9E7E');
export const DuotoneMail = makeLucide('mail', '#1B7FA8');
export const DuotoneMaximize = makeLucide('maximize', '#5A7370');
export const DuotoneMic = makeLucide('mic', '#C44536');
export const DuotoneMicOff = makeLucide('micOff', '#5A7370');
export const DuotoneMicroscope = makeLucide('microscope', '#2E9E7E');
export const DuotoneMinus = makeLucide('minus');
export const DuotoneMonitorSmartphone = makeLucide('monitorSmartphone', '#1B7FA8');
export const DuotoneMoreVertical = makeLucide('moreVertical', '#5A7370');
export const DuotoneNavigation = makeLucide('navigation', '#1B7FA8');
export const DuotoneNetwork = makeLucide('network', '#1B7FA8');
export const DuotonePackage = makeLucide('package', '#E4A84B');
export const DuotonePaperclip = makeLucide('paperclip', '#5A7370');
export const DuotonePause = makeLucide('pause', '#5A7370');
export const DuotonePhoneOff = makeLucide('phoneOff', '#C44536');
export const DuotonePieChart = makeLucide('pieChart', '#1B7FA8');
export const DuotonePlay = makeLucide('play', '#2E9E7E');
export const DuotoneRadio = makeLucide('radio', '#1B7FA8');
export const DuotoneRefresh = makeLucide('refresh', '#2E9E7E');
export const DuotoneRotate = makeLucide('rotate', '#5A7370');
export const DuotoneSave = makeLucide('save', '#2E9E7E');
export const DuotoneSend = makeLucide('send', '#2E9E7E');
export const DuotoneSendHorizontal = makeLucide('sendHorizontal', '#2E9E7E');
export const DuotoneShoppingCart = makeLucide('shoppingCart', '#E4A84B');
export const DuotoneSignal = makeLucide('signal', '#1B9E77');
export const DuotoneSliders = makeLucide('sliders', '#5A7370');
export const DuotoneSquare = makeLucide('square', '#5A7370');
export const DuotoneStar = makeLucide('star', '#E4A84B');
export const DuotoneTable = makeLucide('table', '#5A7370');
export const DuotoneTarget = makeLucide('target', '#C44536');
export const DuotoneThumbsUp = makeLucide('thumbsUp', '#1B9E77');
export const DuotoneTimer = makeLucide('timer', '#E4A84B');
export const DuotoneToggleLeft = makeLucide('toggleLeft', '#5A7370');
export const DuotoneToggleRight = makeLucide('toggleRight', '#2E9E7E');
export const DuotoneTrash = makeLucide('trash', '#C44536');
export const DuotoneTrendingDown = makeLucide('trendingDown', '#C44536');
export const DuotoneTrendingUp = makeLucide('trendingUp', '#1B9E77');
export const DuotoneTruck = makeLucide('truck', '#E4A84B');
export const DuotoneUpload = makeLucide('upload', '#2E9E7E');
export const DuotoneUserX = makeLucide('userX', '#C44536');
export const DuotoneUtensils = makeLucide('utensils', '#E4A84B');
export const DuotoneUtensilsCrossed = makeLucide('utensilsCrossed', '#C44536');
export const DuotoneWind = makeLucide('wind', '#1B7FA8');
export const DuotoneZap = makeLucide('zap', '#E4A84B');
export const DuotoneZapOff = makeLucide('zapOff', '#5A7370');

export default Icon;
