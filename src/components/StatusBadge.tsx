'use client';

type BadgeVariant =
  | 'emergency' | 'warning' | 'watch' | 'normal'
  | 'critical' | 'high' | 'medium' | 'low'
  | 'success' | 'info' | 'danger' | 'muted'
  | 'growing' | 'stable' | 'declining';

const BADGE_STYLES: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  emergency: { color: '#F87171', bg: 'rgba(229,46,66,0.18)', border: 'rgba(229,46,66,0.28)' },
  critical:  { color: '#F87171', bg: 'rgba(229,46,66,0.18)', border: 'rgba(229,46,66,0.28)' },
  danger:    { color: '#F87171', bg: 'rgba(229,46,66,0.18)', border: 'rgba(229,46,66,0.28)' },
  warning:   { color: '#FBBF24', bg: 'rgba(252,211,77,0.16)', border: 'rgba(252,211,77,0.22)' },
  high:      { color: '#FB923C', bg: 'rgba(251,146,60,0.16)', border: 'rgba(251,146,60,0.22)' },
  growing:   { color: '#FB923C', bg: 'rgba(251,146,60,0.16)', border: 'rgba(251,146,60,0.22)' },
  watch:     { color: '#38BDF8', bg: 'rgba(56,189,248,0.16)', border: 'rgba(56,189,248,0.22)' },
  info:      { color: '#38BDF8', bg: 'rgba(56,189,248,0.16)', border: 'rgba(56,189,248,0.22)' },
  medium:    { color: '#FBBF24', bg: 'rgba(252,211,77,0.16)', border: 'rgba(252,211,77,0.22)' },
  stable:    { color: '#FBBF24', bg: 'rgba(252,211,77,0.16)', border: 'rgba(252,211,77,0.22)' },
  normal:    { color: '#4ADE80', bg: 'rgba(62,207,142,0.16)', border: 'rgba(62,207,142,0.22)' },
  success:   { color: '#4ADE80', bg: 'rgba(62,207,142,0.16)', border: 'rgba(62,207,142,0.22)' },
  low:       { color: '#4ADE80', bg: 'rgba(62,207,142,0.16)', border: 'rgba(62,207,142,0.22)' },
  declining: { color: '#4ADE80', bg: 'rgba(62,207,142,0.16)', border: 'rgba(62,207,142,0.22)' },
  muted:     { color: '#A0B1C8', bg: 'rgba(100,116,139,0.18)', border: 'rgba(100,116,139,0.25)' },
};

interface StatusBadgeProps {
  variant: BadgeVariant | string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export default function StatusBadge({ variant, label, size = 'sm', dot = false }: StatusBadgeProps) {
  const style = BADGE_STYLES[variant as BadgeVariant] || BADGE_STYLES.muted;
  const displayLabel = label || variant.charAt(0).toUpperCase() + variant.slice(1);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: style.color }}
        />
      )}
      {displayLabel}
    </span>
  );
}

export { BADGE_STYLES };
export type { BadgeVariant };
