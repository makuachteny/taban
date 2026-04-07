'use client';

export function SkeletonPulse({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background: 'var(--overlay-subtle, rgba(255,255,255,0.05))',
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-elevated p-4 space-y-3">
      <SkeletonPulse className="h-3 w-24" />
      <SkeletonPulse className="h-8 w-16" />
      <div className="space-y-2 pt-2">
        <SkeletonPulse className="h-2.5 w-full" />
        <SkeletonPulse className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-4 pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <SkeletonPulse className="h-4 w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonPulse
                key={j}
                className="h-3 flex-1"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card-elevated p-4">
      <SkeletonPulse className="h-4 w-32 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
          <SkeletonPulse key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonTable />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)}
      </div>
    </div>
  );
}
