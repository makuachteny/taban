'use client';

import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  bg?: string;
  subtitle?: string;
  onClick?: () => void;
  compact?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = '#2B6FE0',
  bg,
  subtitle,
  onClick,
  compact = false,
}: StatCardProps) {
  return (
    <div
      className={`card-elevated ${onClick ? 'cursor-pointer' : ''} ${compact ? 'p-3' : 'p-4'}`}
      onClick={onClick}
      style={bg ? { background: bg } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-semibold uppercase tracking-wider ${compact ? 'text-[9px]' : 'text-[10px]'}`}
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {Icon && (
          <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-xl flex items-center justify-center`} style={{ background: `${color}12` }}>
            <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} style={{ color }} />
          </div>
        )}
      </div>
      <p
        className={`font-bold stat-value ${compact ? 'text-xl' : 'text-2xl'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export interface StatCardLargeProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  bg?: string;
}

export function StatCardLarge({
  label,
  value,
  icon: Icon,
  color = '#2B6FE0',
  bg,
}: StatCardLargeProps) {
  return (
    <div className="card-elevated p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-3xl font-bold stat-value" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
      {Icon && (
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: bg || `${color}12` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      )}
    </div>
  );
}
