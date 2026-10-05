import type { MotionEvent } from './motion-event.types';

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const MOTION_EVENT_FIXTURES: Record<string, MotionEvent[]> = {
  d7: [
    { id: 'd7-e1', state: 'detected', at: minutesAgo(8) },
    { id: 'd7-e2', state: 'clear', at: minutesAgo(13) },
    { id: 'd7-e3', state: 'detected', at: minutesAgo(97) },
    { id: 'd7-e4', state: 'clear', at: minutesAgo(103) },
    { id: 'd7-e5', state: 'detected', at: minutesAgo(211) },
  ],
  d33: [
    { id: 'd33-e1', state: 'detected', at: minutesAgo(22) },
    { id: 'd33-e2', state: 'clear', at: minutesAgo(27) },
    { id: 'd33-e3', state: 'detected', at: minutesAgo(340) },
    { id: 'd33-e4', state: 'clear', at: minutesAgo(346) },
  ],
  d41: [
    { id: 'd41-e1', state: 'detected', at: minutesAgo(680) },
    { id: 'd41-e2', state: 'clear', at: minutesAgo(686) },
  ],
  d46: [
    { id: 'd46-e1', state: 'detected', at: minutesAgo(4) },
    { id: 'd46-e2', state: 'clear', at: minutesAgo(14) },
    { id: 'd46-e3', state: 'detected', at: minutesAgo(24) },
  ],
};

function fallbackEvents(deviceId: string): MotionEvent[] {
  return [
    { id: `${deviceId}-e1`, state: 'detected', at: minutesAgo(4) },
    { id: `${deviceId}-e2`, state: 'clear', at: minutesAgo(9) },
    { id: `${deviceId}-e3`, state: 'detected', at: minutesAgo(96) },
    { id: `${deviceId}-e4`, state: 'clear', at: minutesAgo(102) },
  ];
}

export function motionEventsFor(deviceId: string): MotionEvent[] {
  return MOTION_EVENT_FIXTURES[deviceId] ?? fallbackEvents(deviceId);
}
