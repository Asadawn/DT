export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-sky-100 text-sky-800',
};

const STATUS_TONE: Record<string, StatusTone> = {
  online: 'success',
  active: 'success',
  inactive: 'neutral',
  normal: 'success',
  critical: 'danger',
  resolved: 'success',
  closed: 'neutral',
  complete: 'success',
  verify: 'info',
  offline: 'danger',
  error: 'danger',
  rejected: 'danger',
  stale: 'warning',
  warning: 'warning',
  paused: 'neutral',
  disabled: 'neutral',
  unknown: 'neutral',
  created: 'info',
  triage: 'info',
  assigned: 'info',
  'in-progress': 'warning',
  invited: 'info',
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
  enabled: 'success',
  completed: 'success',
  running: 'info',
  failed: 'danger',
  'partially-failed': 'warning',
  viewed: 'info',
  quoted: 'info',
  selected: 'success',
  'not-selected': 'neutral',
  declined: 'danger',
  expired: 'neutral',
  scheduled: 'info',
  revoked: 'danger',
  occupied: 'success',
  vacant: 'neutral',
  reserved: 'info',
  'checked-in': 'success',
  'checked-out': 'neutral',
  cancelled: 'danger',
  'no-show': 'warning',
};

export function toneForStatus(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'neutral';
}

export function toneClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}

export function statusLabel(status: string): string {
  return status
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
