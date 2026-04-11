/**
 * Shared formatting utilities used across the app for consistent date/time
 * display. Always prefer these helpers over inline `toLocaleDateString()`
 * calls so date formatting stays uniform across modules.
 */

/**
 * Format an ISO 8601 timestamp as "Mon DD, YYYY at HH:mm" (e.g. "Apr 10, 2026 at 14:32").
 *
 * - Returns "—" for falsy / empty inputs.
 * - Returns the raw string if it can't be parsed.
 * - If the input has only a date component (no time), returns the date alone.
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  if (!hasTime) return dateStr;
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Compact variant: "Mon DD · HH:mm" (e.g. "Apr 10 · 14:32"). Used for dense
 * tables where vertical space matters. No year shown — assume "this year".
 */
export function formatCompactDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  if (!hasTime) return dateStr;
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

/**
 * Date-only formatter: "Mon DD, YYYY" (e.g. "Apr 10, 2026").
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Time-only formatter: "HH:mm" (e.g. "14:32").
 */
export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Relative time formatter: "5 min ago", "2 h ago", "3 d ago", or absolute date
 * for anything older than 7 days.
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return formatCompactDateTime(iso);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  return formatDate(iso);
}
